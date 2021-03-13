// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env:"henrydb-8g7n4zhd43011797"
})

const DB = cloud.database();
const _ = DB.command;
const $ = DB.command.aggregate;

// 云函数入口函数
exports.main = async (event, context) => {
  // 这里获取到的 openId、 appId 和 unionId 是可信的，注意 unionId 仅在满足 unionId 获取条件时返回
  // let { APPID, UNIONID } = cloud.getWXContext()
  // console.log(event);
  // console.log(context);
  const OPENID = cloud.getWXContext().OPENID;

  switch (event.action) {
    case 'fundSchedule': {
      return fundSchedule(event)
    }
    case 'otherFundUsers': {
      return otherFundUsers(event)
    }
    // 下个版本废弃***********
    case 'contriToOtherFundUser': {
      return contriToOtherFundUser(event)
    }
    case 'slogan': {
      return slogan(event)
    }
    //下个版本废弃
    case 'fundslogan': {
      return fundslogan(event)
    }
    case 'updatefundslogan': {
      return updatefundslogan(event)
    }
    case 'signUp': {
      return signUp(event)
    }
    case 'contribution': {
      return contribution(event)
    }
    default: {
      return DB.collection("account").where({
        _openid:OPENID
      }).get();
    }
  }

  function fundSchedule(event) {
    return DB.collection('schedule').aggregate()
    .match({
      fund:event.fund
    })
    .lookup({
      from: 'account',
      localField: 'createrId',
      foreignField: '_id',
      as: 'userList',
    })
    .replaceRoot({
      newRoot: $.mergeObjects([ $.arrayElemAt(['$userList', 0]), '$$ROOT' ])
    })
    .project({
      userList: 0,
      _openid: 0,
      join_date: 0,
      last_signin_time: 0,
      has_stock_account: 0,
      peanut: 0,
      xiaocai: 0,
      wine_1573: 0,
      wine_jnc: 0,
      rank: 0,
      contribution: 0,
      reward_from_otheruser: 0
    })
    .end()
  }

  //查询基金会其他成员信息
  function otherFundUsers(event) {
    return DB.collection("account").where({
      fund:event.fund,
      _id:_.neq(event.userId)
    }).field({
      avatarUrl:true,
      name:true,
      _id:true,
      rank:true,
      contribution:true
    }).orderBy('contribution','desc').get();
  }

  //捐赠物资给个人后更新被捐赠对象数据库，下个版本废弃***********
  function contriToOtherFundUser(event) {
    return DB.collection('account').where({
      _id:event.userId
      }).update({
        data: {
          peanut:_.inc(event.peanut),
          xiaocai:_.inc(event.xiaocai),
          wine_jnc:_.inc(event.wine_jnc),
          reward_from_otheruser:_.unshift({
            peanut:event.peanut,
            xiaocai:event.xiaocai,
            wine_jnc:event.wine_jnc,
            from_userid:event.fromuserId,
            from_system:false,
            system_remarks:'个人赠送',
            time:Date.now()
          })
        }
      })
  }

  //捐赠物资给个人后更新被捐赠对象数据库
  function contriToOtherUser(event) {
    return DB.collection('account').where({
      _id:event.toUserId
      }).update({
        data: {
          peanut:_.inc(event.peanut),
          xiaocai:_.inc(event.xiaocai),
          wine_jnc:_.inc(event.wine_jnc),
          reward_from_otheruser:_.unshift({
            peanut:event.peanut,
            xiaocai:event.xiaocai,
            wine_jnc:event.wine_jnc,
            from_userid:event.fromUserId,
            from_system:false,
            system_remarks:'个人赠送',
            time:Date.now()
          })
        }
      })
  }

  //捐赠者扣除物资，根据捐赠类型决定是提高声望还是更新他人物资
  function renewUserResource(event) {
    const peanutscore = 1;
    const xiaocaiscore = 3;
    const wine_jncscore = 5;
    let totalContribution = 0;
    if(event.contriType == 1){
      totalContribution = event.peanut*peanutscore + event.xiaocai*xiaocaiscore + event.wine_jnc*wine_jncscore;
    }
    return DB.collection('account').where({
      _id:event.userId,
      _openid:OPENID
      }).update({
        data: {
          peanut:_.inc(-event.peanut),
          xiaocai:_.inc(-event.xiaocai),
          wine_jnc:_.inc(-event.wine_jnc),
          contribution:_.inc(totalContribution)
        }
      })
  }

  //更新签到信息
  function updateSignInfo(event) {
    return DB.collection('account').where({
      _id:event.userId,
      _openid:OPENID
      }).update({
        data: {
          peanut:_.inc(event.peanut),
          xiaocai:_.inc(event.xiaocai),
          wine_jnc:_.inc(event.wine_jnc),
          last_signin_time:Date.now()
        }
      })
  }

  //下个版本废弃**************************************
  function fundslogan(event) {
    return DB.collection('qkfund').aggregate()
    .match({
      fund:event.fund
    })
    .lookup({
      from: 'account',
      localField: 'slogan.creator',
      foreignField: '_id',
      as: 'userList',
    })
    .replaceRoot({
      newRoot: $.mergeObjects([ $.arrayElemAt(['$userList', 0]), '$slogan' ])
    })
    .project({
      _openid: 0,
      join_date: 0,
      last_signin_time: 0,
      has_stock_account: 0,
      peanut: 0,
      xiaocai: 0,
      wine_1573: 0,
      wine_jnc: 0,
      rank: 0,
      contribution: 0,
      _id:0,
      reward_from_otheruser: 0
    })
    .end()
  }

  //通过基金会代码查询到基金会口号及创作者信息
  function slogan(event) {
    return DB.collection('qkfund').aggregate()
    .match({
      fund:event.fund
    })
    .lookup({
      from: 'account',
      localField: 'slogan.creator',
      foreignField: '_id',
      as: 'userList',
    })
    .replaceRoot({
      newRoot: $.mergeObjects([ $.arrayElemAt(['$userList', 0]),'$slogan', '$$ROOT' ])
    })
    .project({
      _openid: 0,
      join_date: 0,
      last_signin_time: 0,
      has_stock_account: 0,
      peanut: 0,
      xiaocai: 0,
      wine_1573: 0,
      wine_jnc: 0,
      rank: 0,
      contribution: 0,
      _id:0,
      reward_from_otheruser: 0,
      slogan:0,
      userList:0,
    })
    .end()
  }

  //已加入基金会名字参数event.fund
  function updatefundslogan(event) {
    return DB.collection('qkfund').where({
      fund:event.fund,
      }).update({
        data: {
          slogan:{
            words:event.words,
            creator:event.creator,
            time:event.time
          }
        }
      })
  }

  //获取用户签到时间以及资源
  function getUserSignTimeAndResource(event){
    return DB.collection("account").where({
      _id:event.userId,
      _openid:OPENID
    }).field({
      last_signin_time:true,
      peanut:true,
      xiaocai:true,
      wine_jnc:true
    }).limit(1).get();
  }

  //签到所用的云函数
  function signUp(event){
    return new Promise((resolve, reject) => {
      getUserSignTimeAndResource(event).then(res=>{
        if(event.lastSignUpTime == res.data[0].last_signin_time){
          resolve(updateSignInfo(event));
        }else{
          reject('数据已过期');
        }
      })
    })
  }

  //捐赠物资所用的入口云函数
  function contribution(event){
    return new Promise((resolve, reject) => {
      getUserSignTimeAndResource(event).then(res=>{
        if((event.peanut_max == res.data[0].peanut)&&(event.xiaocai_max == res.data[0].xiaocai)&&(event.wine_jnc_max == res.data[0].wine_jnc)){
          if(event.contriType == 1){
            resolve(renewUserResource(event));
          }else if(event.contriType == 2){
            renewUserResource(event).then(res=>{
              resolve(contriToOtherUser(event));
              console.log(res);
              console.log(res.stats.updated);
            })
          }else{
            reject('捐赠类型错误');
          }
        }else{
          reject('数据已过期');
        }
      })
    })
  }

}