const expect = require('chai').expect;
const request = require('supertest');
const { sequelize, Users, Highlights, Pages } = require('../src/models');
const app = require('../src/app');
const server = request(app);
const bcrypt = require('bcryptjs');
const redis = require('../src/redis');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const login = async () => {
  const res = await server.get('/auth/signin').send({
    email: 'tree08',
    password: '1234',
  });
  const { access_token } = res.body;
  return access_token;
};

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

describe('Highlight apis test', () => {
  describe('post /apis/createHighlight', () => {
    it('Bad Request test', async () => {
      const access_token = await login();
      const res = await await server
        .post('/apis/createHighlight')
        .send({
          pageUrl: 'www.naver.com',
          text: '오늘 읽은만한 글',
        })
        .set('Authorization', access_token);
      expect(res.status).to.equal(400);
      expect(res.text).to.equal('Bad Request');
    });

    it('페이지 URL을 기반으로 페이지 정보를 DB에 저장한 뒤 응답에 page의 ID 값을 넘깁니다', async () => {
      const access_token = await login();
      const res = await server
        .post('/apis/createHighlight')
        .send({
          userId: 1,
          pageUrl: 'www.getliner.com',
          colorHex: '#fffff8',
          text: '라이너 사전과제 입니다.',
        })
        .set('Authorization', access_token);

      const page = Pages.findOne({ where: { pageUrl: 'www.getliner.com' } });

      expect(res.status).to.equal(201);
      expect(res.body).to.have.all.keys([
        'highlightId',
        'userId',
        'pageId',
        'colorHex',
        'text',
      ]);
      expect(!page).to.equal(false);
    });
  });

  describe('post updateHighlight', () => {
    it('하이라이트 ID와 유저 ID를 필수로 받습니다', async () => {
      const access_token = await login();
      const res = await server
        .post('/apis/updateHighlight')
        .send({
          userId: 1,
          colorHex: '#fffff8',
          text: '오늘 읽은만한 글',
        })
        .set('Authorization', access_token);

      expect(res.status).to.equal(400);
      expect(res.text).to.equal('Bad Request');
    });

    it('text 혹은 colorHex 둘 중에 하나는 값이 유효해야 합니다', async () => {
      const access_token = await login();
      const res = await server
        .post('/apis/updateHighlight')
        .send({
          userId: 1,
          highlightId: 1,
        })
        .set('Authorization', access_token);

      expect(res.status).to.equal(400);
      expect(res.text).to.equal('Bad Request');
    });

    it('text가 유효하면 성공적으로 response를 받아야합니다.', async () => {
      const access_token = await login();
      const res = await server
        .post('/apis/updateHighlight')
        .send({
          userId: 1,
          highlightId: 1,
          text: '변경된 텍스트입니다',
        })
        .set('Authorization', access_token);

      expect(res.status).to.equal(201);
      expect(res.body).to.have.all.keys([
        'highlightId',
        'userId',
        'pageId',
        'colorHex',
        'text',
      ]);
    });

    it('colorHex가 유효하면 성공적으로 response를 받아야합니다.', async () => {
      const access_token = await login();
      const res = await server
        .post('/apis/updateHighlight')
        .send({
          userId: 1,
          highlightId: 1,
          colorHex: '#a5f2e9',
        })
        .set('Authorization', access_token);

      expect(res.status).to.equal(201);
      expect(res.body).to.have.all.keys([
        'highlightId',
        'userId',
        'pageId',
        'colorHex',
        'text',
      ]);
    });

    it('colorHex와 text가 유효하면 성공적으로 response를 받아야합니다.', async () => {
      const access_token = await login();
      const res = await server
        .post('/apis/updateHighlight')
        .send({
          userId: 1,
          highlightId: 1,
          colorHex: '#a5f2e9',
          text: '변경된 텍스트입니다',
        })
        .set('Authorization', access_token);

      expect(res.status).to.equal(201);
      expect(res.body).to.have.all.keys([
        'highlightId',
        'userId',
        'pageId',
        'colorHex',
        'text',
      ]);
    });

    it('입력 받은 정보를 바탕으로 하이라이트를 저장합니다', async () => {
      const access_token = await login();
      const res = await server
        .post('/apis/updateHighlight')
        .send({
          userId: 1,
          highlightId: 1,
          colorHex: '#fffff8',
          text: '변경된 텍스트입니다',
        })
        .set('Authorization', access_token);

      const highlight = await Highlights.findOne({
        where: { id: 1 },
      });

      expect(res.status).to.equal(201);
      expect(highlight.colorHex).to.equal('#fffff8');
    });
  });
});
