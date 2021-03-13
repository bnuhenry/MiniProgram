// 云函数入口文件
const cloud = require('wx-server-sdk');
const request = require('request-promise');

cloud.init({
  env:"henrydb-8g7n4zhd43011797"
})
const DB = cloud.database();
const _ = DB.command;
const $ = DB.command.aggregate;

// 云函数入口函数
exports.main = async (event) => {

  rank().then(res=>{
    stockRequest(res.list);
  })

}

function stockRequest(stockUserAry){
  const stockIdAry = [];
  for(let i=0;i<stockUserAry.length;i++){
    for(let j=0;j<stockUserAry[i].stock_bonds.length;j++){
      if(stockIdAry.includes(stockUserAry[i].stock_bonds[j].id)){
        continue;
      }else{
        stockIdAry.push(stockUserAry[i].stock_bonds[j].id);
      }
    }
  }
  const url = 'https://api.money.126.net/data/feed/'+stockIdAry;
  request(url)
  .then(function (res) {
      if(res.split('"').length>1){
        const stockObj = JSON.parse(res.split('_ntes_quote_callback(')[1].split(');')[0]);
        for(let i=0;i<stockUserAry.length;i++){
          stockUserAry[i].stockValue = 0;
          for(let j=0;j<stockUserAry[i].stock_bonds.length;j++){
            stockUserAry[i].stockValue += Math.floor(stockUserAry[i].stock_bonds[j].bonds*stockObj[stockUserAry[i].stock_bonds[j].id].price);
          }
          stockUserAry[i].totalValue = Math.floor(stockUserAry[i].stockValue+stockUserAry[i].cash);
          stockUserAry[i].yields = (stockUserAry[i].totalValue-stockUserAry[i].capital)/stockUserAry[i].capital;
        }
        stockUserAry.sort((a,b)=>b.yields-a.yields);
        updateRankList(stockUserAry);
      }

    }) 
  .catch(function (err) {
    console.log(err)
    return err;
    });
}

function rank() {
  return DB.collection('stock').aggregate()
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
    _id:0,
    userList: 0,
    _openid: 0,
    join_date: 0,
    last_signin_time: 0,
    has_stock_account: 0,
    peanut: 0,
    xiaocai: 0,
    wine_1573: 0,
    wine_jnc: 0,
    stock_deal_records: 0,
    stock_focus: 0,
    create_date: 0,
    reward_from_otheruser: 0
  })
  .sort({
    contribution:-1
  })
  .end();
}

function updateRankList(stockUserAry){
  const rankAry = [];
  for(let i=0;i<stockUserAry.length;i++){
    rankAry.push({
      userid:stockUserAry[i].userid,
      stockValue:stockUserAry[i].stockValue,
      totalValue:stockUserAry[i].totalValue,
      cash:stockUserAry[i].cash,
      capital:stockUserAry[i].capital,
      yields:stockUserAry[i].yields
    })
  }
  console.log(rankAry);
  DB.collection('stock_rank_history').add({
      data: {
          ranklist:rankAry,
          time:Date.now()
      },
    }).then(res=>{
      updateUserAward(rankAry);
    })
}

function updateUserAward(rankAry){
  DB.collection('account').where(
    _.or([
      {_id:rankAry[0].userid},
      {_id:rankAry[1].userid},
      {_id:rankAry[2].userid}
    ])).update({
      data: {
        contribution:_.inc(50),
      },
    }).then(res=>{
      console.log(res);
    })
}