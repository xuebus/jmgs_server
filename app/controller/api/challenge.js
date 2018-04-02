'use strict';

const Controller = require('egg').Controller;

class ChallengeController extends Controller {

  constructor(ctx) {
    super(ctx);

    this.ChallengeCreateData = {
      // 敢说所属用户
      belongTo: { type: 'string', required: true, allowEmpty: false },
      // 所属用户
      owner: { type: 'string', required: true, allowEmpty: false },
      // 挑战视频截图
      posterUrl: { type: 'string', required: true, allowEmpty: false },
      // 挑战视频
      videoUrl: { type: 'string', required: true, allowEmpty: false },
    };
  }
  async index() {
    return;
  }
  async create() {
    const { ctx, service } = this;
    try {
      // 验证数据
      ctx.validate(this.ChallengeCreateData);

      const data = ctx.request.body;

      const doc = await service.challenge.create(data);
      if (doc) {
        ctx.status = 200;
        ctx.body = JSON.stringify({ challengeId: doc.id });
      }
    } catch (error) {
      ctx.throw(403, '挑战添加失败！');
    }

  }
  async update() {
    return;
  }
  async destory() {
    return;
  }
  async show() {
    const { ctx, service, app } = this;
    const challengeId = ctx.params.id;
    const authorizeUrl = ctx.helper.authorizeUrl; // (originUrl, deadline, domain, bucketManager)
    const deadline = app.config.qiniu.deadline;
    const domain = app.config.qiniu.bucketDomain;
    const bucketManager = service.auth.initBucketManager();

    let docs = [ await service.challenge.find(challengeId) ];
    ctx.assert(docs, 404, '未找到该挑战：' + challengeId);

    // 是否为更新查新
    const isUpdate = ctx.request.query.isUpdate;
    if (isUpdate) {
      const utilWhen = ctx.request.query.utilWhen;
      const belongTo = docs[0].belongTo;
      docs = await service.challenge.findByTime(belongTo, utilWhen);
    }
    const returnInfo = [];
    for (let i = 0; i < docs.length; i++) {
      const doc = docs[i];
      const challengeOwner = await service.user.find(doc.owner);
      returnInfo.push({
        challengeId: doc.id,
        createTime: doc.createTime,
        challengeOwnerNickName: challengeOwner.nickName,
        challengeOwnerAvatarUrl: challengeOwner.avatarUrl,
        posterUrl: authorizeUrl(doc.posterUrl, deadline, domain, bucketManager), // 需要下载授权
        videoUrl: authorizeUrl(doc.videoUrl, deadline, domain, bucketManager), // 需要下载授权
      });
    }


    ctx.status = 200;
    ctx.body = returnInfo;
    return;
  }
}

module.exports = ChallengeController;
