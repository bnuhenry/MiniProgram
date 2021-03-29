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
  const OPENID = cloud.getWXContext().OPENID;
  switch (event.action) {
    case 'rewardUsers': {
      return rewardUsers(event)
    }
    case 'signUp': {
      return signUp(event)
    }
    case 'contribution': {
      return contribution(event)
    }
    case 'createNewFundUser':{
      return createNewFundUser(event)
    }
  }

  //查询openid匹配的基金会账户是否存在
  function checkIfOpenIdExist(){
    return DB.collection("account").where({
      _openid:OPENID
    }).count();
  }

  //查询物资捐赠方用户信息
  function rewardUsers(event){
    return DB.collection("account").where({
      _id:_.in(event.userIdAry)
    }).field({
      avatarUrl:true,
      name:true,
      _id:true,
    }).get();
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

  //签到所用的云函数，由客户端负责随机生成数字，共有三种不同资源
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

  //新增account集合记录
  function addNewFundAccount(event){
    return DB.collection("account").add({
      data:{
        _openid:OPENID,
        name:event.name,
        avatarUrl:event.avatarUrl,
        peanut:0,
        xiaocai:0,
        wine_jnc:0,
        wine_1573:0,
        contribution:0,
        rank:0,
        fund:'other',
        last_signin_time:0,
        has_stock_account:false,
        reward_from_otheruser:[],
        join_date:Date.now()
      },
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

  //创建基金会用户入口
  function createNewFundUser(event){
    return new Promise((resolve,reject)=>{
      checkIfOpenIdExist().then(res=>{
        if(res.total == 0){
          resolve(addNewFundAccount(event));
        }else if(res.total > 0){
          reject('您已有基金会账户');
        }
      })
    })
  }

}