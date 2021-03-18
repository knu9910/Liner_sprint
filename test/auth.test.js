const expect = require('chai').expect;
const request = require('supertest');
const { sequelize, Users } = require('../src/models');
const app = require('../src/app');
const server = request(app);
const bcrypt = require('bcryptjs');
const redis = require('../src/redis');
const jwt = require('jsonwebtoken');
require('dotenv').config();

before(async () => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashPass = await bcrypt.hash('1234', salt);
    await sequelize.sync();
    await Users.create({
      name: '김나무',
      email: 'tree08',
      password: hashPass,
    });
  } catch (err) {
    console.error(err);
  }
});

after(async () => {
  try {
    await sequelize.drop();
    await sequelize.close();
    await app.close();
    await redis.quit();
  } catch (err) {
    console.error(err);
  }
});

describe('Auth API TEST', () => {
  describe('get /auth/signup', () => {
    it('Bad Request test', async () => {
      const res = await await server.post('/auth/signup').send({
        nickname: 'dododo',
        emall: 'asd123',
        pass: '0000',
      });

      expect(res.status).to.equal(400);
      expect(res.text).to.equal('Bad Request');
    });

    it('회원가입에 성공하여야 합니다.', async () => {
      const res = await server.post('/auth/signup').send({
        name: '김한우',
        email: 'hanu123',
        password: '0000',
      });

      const user = await Users.findOne({ where: { email: 'hanu123' } });

      expect(res.status).to.equal(201);
      expect(user.email).to.equal('hanu123');
    });

    it('이미 회원인 경우 에러를 발생합니다.', async () => {
      const res = await server.post('/auth/signup').send({
        name: '김나무',
        email: 'tree08',
        password: '1234',
      });

      expect(res.status).to.equal(409);
      expect(res.text).to.equal('Already User');
    });

    it('사용자의 비밀번호는 해싱 되어야 합니다.', async () => {
      const user = await Users.findOne({ where: { email: 'tree08' } });
      const judge = await bcrypt.compare('1234', user.password);

      expect(judge).to.equal(true);
    });
  });

  describe('get /auth/signin', () => {
    it('Bad Request test', async () => {
      const res = await await server.get('/auth/signin').send({
        emall: 'asd123',
        pass: '0000',
      });

      expect(res.status).to.equal(400);
      expect(res.text).to.equal('Bad Request');
    });

    it('희원인 유저는 로그인 되어야 합니다.', async () => {
      const res = await server.get('/auth/signin').send({
        email: 'hanu123',
        password: '0000',
      });

      const { userinfo } = res.body;

      expect(res.status).to.equal(200);
      expect(!userinfo).to.equal(false);
    });

    it('로그인을 하면 토큰을 받아야 합니다.', async () => {
      const res = await server.get('/auth/signin').send({
        email: 'tree08',
        password: '1234',
      });

      expect(res.status).to.equal(200);
      expect(res.body).to.have.all.keys([
        'userinfo',
        'access_token',
        'refresh_token',
      ]);
    });

    it('회원이 아닌 유저는 로그인이 실패합니다.', async () => {
      const res = await server.get('/auth/signin').send({
        email: 'koko33',
        password: '78',
      });

      expect(res.status).to.equal(404);
      expect(res.text).to.equal('Nonexistent User');
    });

    it('비밀번호가 틀리면 로그인이 실패합니다', async () => {
      const res = await server.get('/auth/signin').send({
        email: 'tree08',
        password: '34',
      });

      expect(res.status).to.equal(404);
      expect(res.text).to.equal('Wrong Password');
    });
  });

  describe('get /auth/signout', () => {
    it('Bad Request test', async () => {
      const res = await await server.post('/auth/signout').send({
        access_tokem: 'asd123',
        refresh_tokem: '0000',
      });

      expect(res.status).to.equal(400);
      expect(res.text).to.equal('Bad Request');
    });

    it('로그아웃을 하면 발급한 access_token을 쓰지 못합니다', async () => {
      const signinRes = await server.get('/auth/signin').send({
        email: 'hanu123',
        password: '0000',
      });

      const { access_token, refresh_token } = signinRes.body;

      const signoutRes = await server.post('/auth/signout').send({
        access_token,
        refresh_token,
      });

      const blacklist_token = await redis.get(`blacklist_${access_token}`);

      expect(signoutRes.status).to.equal(201);
      expect(signoutRes.text).to.equal('ok');
      expect(!blacklist_token).to.equal(false);
    });

    it('로그아웃을 하면 발급한 refresh_token을 쓰지 못합니다', async () => {
      const signinRes = await server.get('/auth/signin').send({
        email: 'hanu123',
        password: '0000',
      });

      const { access_token, refresh_token } = signinRes.body;
      const signoutRes = await server.post('/auth/signout').send({
        access_token,
        refresh_token,
      });

      const blacklist_token = await redis.get(`blacklist_${refresh_token}`);

      expect(signoutRes.status).to.equal(201);
      expect(signoutRes.text).to.equal('ok');
      expect(!blacklist_token).to.equal(false);
    });
  });

  describe('get /auth/refresh', () => {
    it('Bad Request test', async () => {
      const res = await server.get('/auth/refresh');

      expect(res.status).to.equal(400);
      expect(res.text).to.equal('Bad Request');
    });

    it('잘못된 토큰이면 권한없음을 알려줍니다', async () => {
      const res = await server
        .get('/auth/refresh')
        .set('Authorization', 'token');

      expect(res.status).to.equal(401);
      expect(res.text).to.equal('Unauthorized');
    });

    it('발급한 토큰이 맞다면 access_token을 재발급 합니다', async () => {
      const signinRes = await server.get('/auth/signin').send({
        email: 'tree08',
        password: '1234',
      });

      const { userinfo, refresh_token } = signinRes.body;

      const refreshRes = await server
        .get('/auth/refresh')
        .set('Authorization', refresh_token);

      const { access_token } = refreshRes.body;
      const secretKey = process.env.TOKEN_KEY;
      const reUserinfo = await jwt.verify(access_token, secretKey);

      expect(refreshRes.status).to.equal(200);
      expect(refreshRes.body).to.have.all.keys(['access_token']);
      expect(reUserinfo.id).to.equal(userinfo.id);
      expect(reUserinfo.email).to.equal(userinfo.email);
    });
  });
});
