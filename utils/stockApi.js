function getChinaStockInfo(stockIdArray){
  return new Promise((resolve, reject) => {
    wx.request({
      url: 'https://api.money.126.net/data/feed/'+stockIdArray,
      success:res=>{
        if(res.data.split('"').length>1){
          resolve(JSON.parse(res.data.split('_ntes_quote_callback(')[1].split(');')[0]));
        }else{
          resolve(false);
        }
      },
      fail:res=>{
        wx.hideLoading();
        reject(res);
        console.log(res);
      }
    })
  })
}

function getSinaFinancialNews(){
  return new Promise((resolve, reject) => {
    wx.request({
      url: 'https://interface.sina.cn/ent/feed.d.json?ch=finance',
      success:res=>{
        resolve(res.data.data);
      },
      fail:res=>{
        wx.hideLoading();
        reject(res);
        console.log(res);
      }
    })
  })
}

function getUSStockIndex(){
  return new Promise((resolve, reject) => {
    wx.request({
      url: 'https://hq.sinajs.cn/?list=gb_dji,gb_ixic,gb_inx',
      success:res=>{
        resolve(res.data.split('"'));
      },
      fail:res=>{
        reject(res);
      }
    })
  })
}

module.exports.getChinaStockInfo = getChinaStockInfo;
module.exports.getSinaFinancialNews = getSinaFinancialNews;
module.exports.getUSStockIndex = getUSStockIndex;