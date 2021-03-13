// pages/stock/stock.js
const app = getApp()

Page({

  data: {
    userAvatar:String,
    userName:String,
    userId:String,
    hasstockaccount:Boolean,
    accountCash:0,
    accountCapital:0,
    accountStockValue:0,
    showStockPicker:false,
    showStockUserPicker:false,
    showStockDealRecords:false,
    stockRequestId:String,
    openType:Number,
    accountPosition:String,
    accountYields:String,
    accountWin:false,
    stockMsg:String,
    focusStockIdAry:Array,
    bondsStockAry:Array,
    focusStockObj:Object,
    bondsStockObj:Object,
    stockDealRecordsAry:Array,
    topOptionSelected:1,
    isMyStockAccount:false,
    costSingleStock:Number,
    firstLoadDone:false,
    refreshButtonDisalbe:false,
    otherStockUserAry:[],
  },


  // 生命周期函数--监听页面加载
  onLoad: function (options) {
    if(app.globalData.gotFundInfo){
      this.firstLoadUserInfo();
    }
  },

  // 生命周期函数--监听页面加载
  onShow: function () {
    this.refreshPageData();
  },


  // 页面相关事件处理函数--监听用户下拉动作
  onPullDownRefresh: function () {
    this.getStockAccountInfo();
  },

  // 在云端数据加载完毕的情况下刷新页面
  refreshPageData:function(){
    this.setData({
      refreshButtonDisalbe:true
    })
    if(this.data.firstLoadDone){
      if(this.data.bondsStockAry.length>0){
        this.makeBondsStockObj(this.data.bondsStockAry);
      }
      if(this.data.focusStockIdAry.length>0){
        this.makeFocusStockAry(this.data.focusStockIdAry);
      }
    }
    setTimeout(()=>{
      this.setData({
        refreshButtonDisalbe:false
      })
    },3000);
  },

  //初次加载股票账户信息
  firstLoadUserInfo:function(){
    this.setData({
      userAvatar:app.globalData.fundUserInfo.avatarUrl,
      userName:app.globalData.fundUserInfo.name,
      userId:app.globalData.userId,
      hasstockaccount:app.globalData.fundUserInfo.has_stock_account,
      isMyStockAccount:true,
    })
    if(this.data.hasstockaccount){
      console.log('已开通股票账户');
      this.getStockAccountInfo();
    }else{
      console.log('还未开通股票账户');
    }
  },

  //初始化数据
  initData:function(){
    this.setData({
      accountStockValue:0,
      accountPosition:'',
      accountYields:'',
      accountWin:false,
      accountCash:0,
      accountCapital:0,
      focusStockIdAry:[],
      bondsStockAry:[],
      focusStockObj:{},
      bondsStockObj:{},
      stockDealRecordsAry:[],
    })
  },

  //点击模拟盘开户
  clickCreateStockAccount:function(){
    wx.showModal({
      title: '模拟盘开户',
      content: '确定创建模拟盘账户？',
      success:res=> {
        if (res.confirm) {
          if(app.globalData.gotFundInfo){
            if(this.data.userId!=app.globalData.fundUserInfo._id){
              this.setData({
                userId:app.globalData.fundUserInfo._id
              })
              this.createNewStockAccount();
            }else{
              this.createNewStockAccount();
            }
          }else{
            wx.showToast({
              title: '未获取用户ID',
              icon:'error',
              duration: 2000
            })
          }
          console.log('确定');
        } else if (res.cancel) {
          console.log('我再想想')
        }
      }
    })
  },

  //ajax创建stock集合新记录
  createNewStockAccount:function(){
    if(app.globalData.gotFundInfo){
      wx.showLoading({
        title: '开通账户中',
      })
      const DB = wx.cloud.database().collection("stock");
      DB.add({
        data:{
          userid:app.globalData.fundUserInfo._id,
          cash:1000000,
          capital:1000000,
          stock_bonds:[],
          stock_focus:[],
          stock_deal_records:[],
          create_date:Date.now()
        },
        success:res=>{
          wx.hideLoading();
          console.log('创建成功');
          this.updateHasStockAccToAccount();
        },
        fail:res=>{
          wx.hideLoading();
          console.log("连接数据库失败");
        }
      })
    }else{
      console.log('获取用户id失败');
    }
  },

  //ajax更新account集合has_stock_account字段到云端
  updateHasStockAccToAccount:function(){
    wx.showLoading({
      title: '加载中',
    })
    const DB = wx.cloud.database();
    DB.collection("account").doc(this.data.userId).update({
      data:{
        has_stock_account:true
      },
      success:res=>{
        wx.hideLoading();
        if(res.stats.updated>0){
          console.log("创建模拟盘账户成功!");
          this.setData({
            stockMsg:'创建模拟盘账户成功!',
            hasstockaccount:true
          })
          app.getFundUserInfo();
          this.getStockAccountInfo();
        }else{
          console.log("创建失败");
        }
      },
      fail:res=>{
        wx.hideLoading();
        console.log("更新云数据失败!");
        this.setData({
          editMsg:'更新云数据失败!'
        })
      }
    })
  },

  //查询股票账户信息
  getStockAccountInfo:function(){
    wx.showLoading({
      title: '加载中',
    })
    const DB = wx.cloud.database();
    DB.collection('stock').where({
      userid:this.data.userId
    }).limit(1).get({
      success:res=>{
        wx.hideLoading();
        if(res.data.length>0){
          this.setData({
            accountCash:res.data[0].cash,
            accountCapital:res.data[0].capital,
            focusStockIdAry:res.data[0].stock_focus,
            stockDealRecordsAry:res.data[0].stock_deal_records,
            bondsStockAry:res.data[0].stock_bonds,
            firstLoadDone:true,
          })
          this.makeBondsStockObj(res.data[0].stock_bonds);
          this.makeFocusStockAry(res.data[0].stock_focus);
        }else{
          console.log("查询不到模拟盘用户信息");
        }

      },
      fail:res=>{
        console.log("获取云数据失败");
        wx.hideLoading();
      },
    })
  },

  //根据股票账户持仓生成持有股票数组并计算市值
  makeBondsStockObj:function(array){
    const today = new Date().getDate();
    const length = array.length;
    const stockIdArray = [];
    const stockDealRecordsAry = this.data.stockDealRecordsAry;
    let stockObj = {};
    let stockTotalValue = 0;
    if(length>0){
      wx.showLoading({
        title: '加载中',
      })
      for(let i=0;i<length;i++){
        stockIdArray.push(array[i].id);
      }
      const url = 'https://api.money.126.net/data/feed/'+stockIdArray;
      wx.request({
        url: url,
        success:res=>{
          wx.hideLoading();
          if(res.data.split('"').length>1){
            stockObj = JSON.parse(res.data.split('_ntes_quote_callback(')[1].split(');')[0]);
            for(let i=0;i<length;i++){
              stockObj[array[i].id].bonds = array[i].bonds;
              stockObj[array[i].id].costTotal = 0;
              stockObj[array[i].id].canNotSellAmount = 0;
              for(let j=0;j<stockDealRecordsAry.length;j++){
                if(stockDealRecordsAry[j].id == array[i].id){
                  const date = new Date(stockDealRecordsAry[j].time);
                  stockObj[array[i].id].costTotal += stockDealRecordsAry[j].price*stockDealRecordsAry[j].amount;
                  if(stockDealRecordsAry[j].buy&&date.getDate()==today){
                    stockObj[array[i].id].canNotSellAmount += stockDealRecordsAry[j].amount;
                  }
                }
              }
            }
            for(let key in stockObj){
              stockObj[key].rate = this.getIncreaseRate(stockObj[key].percent);
              stockObj[key].value = Number(Number(stockObj[key].price)*Number(stockObj[key].bonds)).toFixed(0),
              stockObj[key].cost = Number(stockObj[key].costTotal/stockObj[key].bonds).toFixed(2);
              stockObj[key].canSell = Number(stockObj[key].bonds) - Number(stockObj[key].canNotSellAmount);
              stockObj[key].benefit = Number(Number(stockObj[key].value) - stockObj[key].costTotal).toFixed(0);
              stockObj[key].benefitRate = this.getIncreaseRate(Number((Number(stockObj[key].benefit)/stockObj[key].costTotal)));
              stockObj[key].win = Number(stockObj[key].benefit)>0;
              stockTotalValue += Number(stockObj[key].value);
            }
            this.setData({
              accountStockValue:Number(stockTotalValue.toFixed(0)),
              accountPosition:this.getAccountPosition(stockTotalValue,this.data.accountCash),
              accountYields:this.getAccountYields(stockTotalValue,this.data.accountCash,this.data.accountCapital),
              accountWin:stockTotalValue+this.data.accountCash-this.data.accountCapital>0,
              bondsStockObj:stockObj,
            })
          }
        },
        fail:res=>{
          wx.hideLoading();
          console.log(res);
        }
      })
    }else{
      console.log('股票代码数组为空');
    }
  },

   //云端获取关注股票代码数组生成本地数组
   makeFocusStockAry:function(array){
    const length = array.length;
    let stockObj = {};
    if(length>0){
      wx.showLoading({
        title: '加载中',
      })
      const url = 'https://api.money.126.net/data/feed/'+array;
      wx.request({
        url: url,
        success:res=>{
          wx.hideLoading();
          if(res.data.split('"').length>1){
            stockObj = JSON.parse(res.data.split('_ntes_quote_callback(')[1].split(');')[0]);
            for(let key in stockObj){
              stockObj[key].rate = this.getIncreaseRate(stockObj[key].percent);
            }
            this.setData({
              focusStockObj:stockObj
            })
          }else{
            console.log('没有返回任何股票信息');
          }
        },
        fail:res=>{
          wx.hideLoading();
          console.log(res);
        }
      })
    }else{
      console.log('股票代码数组为空');
    }
  },

  //点击查询股票弹出股票筛选组件
  showStockPickerPanel:function(){
    this.setData({
      openType:0,
      showStockPicker:!this.data.showStockPicker
    })
  },

  //点击查看交易记录组件
  showStockDealRecordsPanel:function(){
    this.setData({
      showStockDealRecords:!this.data.showStockDealRecords
    })
  },

  //获取账户目前仓位
  getAccountPosition:function(stock,cash){
    const position = stock/(cash+stock);
    if(position == 0){
      return '空仓';
    }else if(position < 0.1){
      return '不到1成';
    }else if(position > 0.95&&position < 0.98){
      return '接近满仓';
    }else if(position >= 0.98){
      return '满仓';
    }else{
      return Number(position*10).toFixed(0) + '成';
    }
  },
  
  //获取账户总收益率
  getAccountYields:function(stock,cash,capital){
    const upOrDown = (cash + stock - capital)>0?'+':'-';
    const yields = Math.abs(cash + stock - capital);
    return upOrDown + Number((yields*100)/capital).toFixed(2) + '%';
  },

  //根据网易股票数据接口要求向股票代码添加请求字符串
  getStockRequestId:function(id){
    const exChangeHouse = id.toString().substr(0,1);
    if(exChangeHouse==6){
      return '0'+id
    }else if(exChangeHouse==0||exChangeHouse==3){
      return '1'+id
    }
  },

  //获取金额数字，超过一万显示万，超过亿显示亿
  getAmountStr:function(number){
    if(number>=10000 && number<100000000){
      return (number/10000).toFixed(2) + '万';
    }else if(number>=100000000){
      return (number/100000000).toFixed(2) + '亿';
    }else{
      return number;
    }
  },

  //获取交易手数，返回显示数据
  getHandAmountStr:function(number){
    const dealHandAmount = number/100
    if(dealHandAmount>=10000 && dealHandAmount<100000000){
      return (dealHandAmount/10000).toFixed(2) + '万';
    }else if(dealHandAmount>=100000000){
      return (dealHandAmount/100000000).toFixed(2) + '亿';
    }else{
      return dealHandAmount.toFixed(0);
    }
  },

  //获取股票涨幅
  getIncreaseRate:function(percent){
    const percentAbs = Math.abs(percent*100);
    const upOrDown = percent > 0 ? '+':'-';
    return upOrDown+Number(percentAbs).toFixed(2)+'%';
  },

  //ajax请求新浪股票数据接口
  // getStockInfo:function(stockRequestId){
  //   wx.request({
  //     url: 'https://hq.sinajs.cn/list='+stockRequestId,
  //     header:{'content-type':'application/x-www-form-urlencoded;'},
  //     success:res=>{
  //       console.log(res);
  //       this.setData({
  //         stockName:res.data.split('"')[1].split(',')[0],
  //         stockId:this.data.inputStockId,
  //         recentPrice:Number(res.data.split('"')[1].split(',')[3]).toFixed(2),
  //         openPrice:Number(res.data.split('"')[1].split(',')[1]).toFixed(2),
  //         yeClosePrice:Number(res.data.split('"')[1].split(',')[2]).toFixed(2),
  //         increaseRate:this.getIncreaseRate(res.data.split('"')[1].split(',')[3],res.data.split('"')[1].split(',')[2]),
  //         dealHandAmount:this.getHandAmountStr(res.data.split('"')[1].split(',')[8]),
  //         dealAmount:this.getAmountStr(res.data.split('"')[1].split(',')[9]),
  //         stockHeigthestPrice:Number(res.data.split('"')[1].split(',')[4]).toFixed(2),
  //         stockLowestPrice:Number(res.data.split('"')[1].split(',')[5]).toFixed(2),
  //         // SHIndexUp:Number(res.data.split('"')[1].split(',')[3])>Number(res.data.split('"')[1].split(',')[2])?true:false,
  //       })
  //     },
  //     fail:res=>{
  //       console.log(res);
  //     }
  //   })
  // },

  //ajax请求网易126股票数据接口
  getStockInfo:function(stockRequestId){
    wx.showLoading({
      title: '加载中',
    })
    let stockObj;
    wx.request({
      url: 'https://api.money.126.net/data/feed/'+stockRequestId,
      success:res=>{
        wx.hideLoading();
        stockObj = JSON.parse(res.data.split('_ntes_quote_callback(')[1].split(');')[0]);
        this.setData({
          focusStockObj:stockObj
        })
      },
      fail:res=>{
        wx.hideLoading();
        console.log(res);
      }
    })
  },

  //点击关注股票列表进入股票筛选组件
  clickFocusStock:function(e){
    const sid = e.currentTarget.dataset.id;
    this.setData({
      openType:1,
      stockRequestId:sid,
      showStockPicker:true
    })
  },

  //点击持仓选项按钮
  selectOptionBonds:function(){
    if(this.data.topOptionSelected!=2){
      this.setData({
        topOptionSelected:2
      })
    }
  },

  //点击关注选项按钮
  selectOptionFocus:function(){
    if(this.data.topOptionSelected!=1){
      this.setData({
        topOptionSelected:1
      })
    }
  },

  //调用云函数查询其他已开通证券账户
  clickCheckOtherStockUser:function(){
    this.setData({
      showStockUserPicker:!this.data.showStockUserPicker
    })
  },

  //传入参数获取此账户信息发送股票账户信息请求
  getOtherStockAccountInfo:function(userObj){
    wx.showLoading({
      title: '加载中',
    })
    this.setData({
      userAvatar:userObj.avatarUrl,
      userName:userObj.name,
      userId:userObj._id,
      hasstockaccount:true,
      isMyStockAccount:userObj._id==app.globalData.userId,
    })
    this.initData();
    wx.cloud.callFunction({
      name:'stock',
      data: {
        action: 'otherStockAccount',
        userId:userObj._id,
      },
      complete:res=>{
        wx.hideLoading();
        if(res.result.data.length>0){
          this.setData({
            accountCash:res.result.data[0].cash,
            accountCapital:res.result.data[0].capital,
            focusStockIdAry:res.result.data[0].stock_focus,
            bondsStockAry:res.result.data[0].stock_bonds,
            stockDealRecordsAry:res.result.data[0].stock_deal_records
          })
          this.makeBondsStockObj(res.result.data[0].stock_bonds);
          this.makeFocusStockAry(res.result.data[0].stock_focus);
        }else{
          console.log('查询他人模拟盘账户失败');
        }
      }
    })
  },

  //点击返回自己的账户
  backToMyStockAccount:function(){
    this.setData({
      userAvatar:app.globalData.fundUserInfo.avatarUrl,
      userName:app.globalData.fundUserInfo.name,
      userId:app.globalData.userId,
      hasstockaccount:app.globalData.fundUserInfo.has_stock_account,
      isMyStockAccount:true,
    })
    this.initData();
    if(this.data.hasstockaccount){
      this.getStockAccountInfo();
    }else{
      console.log('还未开通股票账户');
    }
  },

  //点击查看跳转至rank页面
  clickCheckRank:function(){
    const that = this;
    wx.navigateTo({
      url: '../rank/rank',
      events: {
        // 为指定事件添加一个监听器，获取被打开页面传送到当前页面的数据
        receiveUserObjFromRankPage: function(userObj) {
          that.getOtherStockAccountInfo(userObj);
        }
      },
      success: function(res) {
        // 通过eventChannel向被打开页面传送数据
        res.eventChannel.emit('requestUserId', { userId:app.globalData.userId, })
      }
    })
  },

  //接受其他账户选择组件回传股票账户信息对象
  getOtherStockUserObj:function(e){
    const otherStockUserObj = e.detail;
    if(otherStockUserObj._id){
      this.getOtherStockAccountInfo(e.detail);
    }
  },

  //接受其他账户选择组件回传股票账户信息数组储存到本地不用再向云端请求
  getOtherStockUserAry:function(e){
    const otherStockUserAry = e.detail;
    if(otherStockUserAry.length>0){
      this.setData({
        otherStockUserAry:otherStockUserAry
      })
    }
  },

  //接受股票组件回传刷新股票数据信号
  getStockDataChanged:function(e){
    const isStockDataChanged = e.detail;
    if(isStockDataChanged){
      this.firstLoadUserInfo();
    }
  },

  //接受股票组件回传添加关注股票
  getFocusStockId:function(e){
    const idAry = this.data.focusStockIdAry;
    idAry.push(e.detail);
    this.setData({
      focusStockIdAry:idAry
    })
    this.makeFocusStockAry(this.data.focusStockIdAry);
  },

  //接受股票组件回传取消关注股票
  getCancelFocusStockId:function(e){
    const idAry = this.data.focusStockIdAry;
    let deleteIndex;
    for(let i=0;i<idAry.length;i++){
      if(e.detail == idAry[i]){
        deleteIndex = i;
      }
    }
    idAry.splice(deleteIndex,1);
    this.setData({
      focusStockIdAry:idAry
    })
    this.makeFocusStockAry(this.data.focusStockIdAry);
  },

  //接受股票组件回传关闭参数
  getStockPickerOff:function(e){
    this.setData({
      showStockPicker:e.detail
    })
  },

  //接受其他模拟盘用户组件回传关闭参数
  getStockUserPickerOff:function(e){
    this.setData({
      showStockUserPicker:e.detail
    })
  },

  //接受其他模拟盘用户组件回传关闭参数
  getStockDealRecordsOff:function(e){
    this.setData({
      showStockDealRecords:e.detail
    })
  }

})