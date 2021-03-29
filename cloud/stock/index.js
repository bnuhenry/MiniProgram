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
  const OPENID = cloud.getWXContext().OPENID;

  switch (event.action) {
    case 'otherStockUsers': {
      return otherStockUsers(event)
    }
    case 'otherStockAccount': {
      return otherStockAccount(event)
    }
    case 'createNewStockAccount' :{
      return createNewStockAccount(event)
    }
    case 'upgradeStockAccount':{
      return upgradeStockAccount(event)
    }
  }

  //查询其他已开通模拟盘用户信息列表
  function otherStockUsers(event) {
    return DB.collection("account").where({
      has_stock_account:true,
      _id:_.neq(event.userId)
    }).field({
      avatarUrl:true,
      name:true,
      _id:true,
      rank:true,
      contribution:true
    }).orderBy('contribution','desc').get();
  }

  //查询其他个人模拟盘账户信息
  function otherStockAccount(event) {
    return DB.collection('stock').where({
      userid:event.userId
    }).field({
      _id:false,
      _openid:false
    }).limit(1).get()
  }

  //查询基金会账户信息是否开启了股票模拟盘信息
  function checkUserAccountInfo(event){
    return DB.collection("account").where({
      has_stock_account:false,
      _id:event.userId,
      _openid:OPENID
      }).update({
        data: {
          has_stock_account:true,
        }
      })
  }

  //模拟盘开户
  function addStockAccount(event){
    return DB.collection('stock').add({
        data:{
          userid:event.userId,
          _openid:OPENID,
          cash:1000000,
          capital:1000000,
          stock_bonds:[],
          stock_focus:[],
          stock_deal_records:[],
          create_date:Date.now()
        }
      })
  }

  //创建模拟盘账户云函数入口
  function createNewStockAccount(event){
    return new Promise((resolve, reject) => {
      checkUserAccountInfo(event,OPENID).then(res=>{
        const hasNoStockAccount = res.stats.updated>0;
        if(hasNoStockAccount){
          resolve(addStockAccount(event));
        }else{
          reject('已有模拟盘账户');
        }
      })
    })
  }

  //聚合查询两个集合用户股票账户本金以及基金会声望
  function getStockCapitalAndContribution(event){
    return DB.collection('stock').aggregate()
    .match({
      userid:event.userId
    })
    .lookup({
      from: 'account',
      localField: 'userid',
      foreignField: '_id',
      as: 'userList',
    })
    .replaceRoot({
      newRoot: $.mergeObjects([ $.arrayElemAt(['$userList', 0]), '$$ROOT' ])
    })
    .project({
      contribution:1,
      capital:1,
    })
    .limit(1)
    .end()
  }

  //升级模拟盘判断条件选择更新的本金多少以及加入多少现金，需要云函数应对双开客户端前后请求
  function updateStockAccountCaptital(event,capital,contribution){
    let canRewardCapital = 0;
    if(contribution>=10000){
      canRewardCapital = Math.floor(100000000 - capital);
    }else if(contribution>=5000){
      canRewardCapital = Math.floor(50000000 - capital);
    }else if(contribution>=2500){
      canRewardCapital = Math.floor(10000000 - capital);
    }
    if(canRewardCapital>0){
      return DB.collection('stock').where({
          userid:event.userId
        }).update({
          data:{
            cash:_.inc(canRewardCapital),
            capital:_.inc(canRewardCapital)
          },
        })
    }else{
      return new Promise((resolve,reject)=>{
        reject('条件未达到，无法升级模拟盘账户')
      })
    }
  }

  //升级模拟盘账户所用的云函数,首先判断客户端传递参数是否和数据库的一致
  function upgradeStockAccount(event){
    return new Promise((resolve, reject) => {
      getStockCapitalAndContribution(event).then(res=>{
        if(event.capital == res.list[0].capital){
          resolve(updateStockAccountCaptital(event,res.list[0].capital,res.list[0].contribution));
        }else{
          reject('数据已过期');
        }
      })
    })
  }

}