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

module.exports.getChinaStockInfo = getChinaStockInfo;