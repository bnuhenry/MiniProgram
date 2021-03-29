// pages/stock/stock.js
const app = getApp()
const getStockInfoFromNetEase = require("../../utils/stockApi.js")
const fundUserApi = require("../../utils/loginApi.js")

Page({

  data: {
    showStockPicker:false,
    showStockUserPicker:false,
    showStockDealRecords:false,
    accountWin:false,
    topOptionSelected:1,
    isMyStockAccount:false,
    isJoinedFundUser:false,
    firstLoadDone:false,
    refreshButtonDisalbe:false,
    canBondsAllClear:false,
    creatStockAccountButtonDisable:false,
    focusStockAry:[],
    bondsStockAry:[],
    stockDealRecordsAry:[],
  },


  // 生命周期函数--监听页面加载
  onLoad: function (options) {
    if(app.globalData.gotFundInfo&&!this.data.firstLoadDone){
      this.firstLoadUserInfo();
    }
  },

  // 生命周期函数--监听页面加载
  onShow: function () {
    this.refreshPageData();
  },

  // 在云端数据加载完毕的情况下刷新页面
  refreshPageData:function(){
    this.setData({
      refreshButtonDisalbe:true
    })
    // 模拟盘升级之后需要重新请求数据
    if(app.globalData.needRecheckStockAccount&&app.globalData.gotFundInfo){
      app.globalData.needRecheckStockAccount = false;
      this.getMyStockAccountInfo();
    }
    if(this.data.firstLoadDone&&this.data.hasstockaccount){
      if(this.data.bondsStockAry.length>0 || this.data.focusStockAry.length>0 || this.data.stockDealRecordsAry.length>0){
        this.makeStockObj(this.data.bondsStockAry,this.getIdAryFromFocusAry(this.data.focusStockAry),this.data.stockDealRecordsAry);
      }
    }else if(app.globalData.gotFundInfo&&!this.data.firstLoadDone){
      this.firstLoadUserInfo();
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
      firstLoadDone:true,
      isJoinedFundUser:app.globalData.fundUserInfo.fund != 'other',
    })
    if(this.data.hasstockaccount){
      console.log('已开通股票账户');
      this.getMyStockAccountInfo();
    }else{
      this.initData();
      console.log('还未开通股票账户');
    }
  },

  //初始化数据
  initData:function(){
    this.setData({
      accountStockValue:0,
      accountTotalValue:0,
      accountPosition:'',
      accountYields:'',
      accountWin:false,
      accountCash:0,
      accountCapital:0,
      focusStockAry:[],
      bondsStockAry:[],
      stockDealRecordsAry:[],
      canBondsAllClear:false,
    })
  },

  //点击模拟盘开户
  clickCreateStockAccount:function(){
    if(this.data.isJoinedFundUser){
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
              this.toast('未获取用户ID',false);
            }
            console.log('确定');
          } else if (res.cancel) {
            console.log('我对模拟盘没兴趣')
          }
        }
      })
    }else{
      this.toast('请先加入基金会',false);
    }
  },

  //云端创建stock集合新记录
  createNewStockAccount:function(){
    if(app.globalData.gotFundInfo){
      wx.showLoading({
        title: '开通账户中',
      })
      this.setData({
        creatStockAccountButtonDisable:true
      })
      wx.cloud.callFunction({
        name:'stock',
        data:{
          action:'createNewStockAccount',
          userId:app.globalData.userId,
        },
        success:res=>{
          wx.hideLoading();
          this.toast('开通成功',true);
          fundUserApi.getFundUserInfo().then(res=>{
            this.firstLoadUserInfo();
          });
        },
        fail:res=>{
          console.log(res);
          wx.hideLoading();
          this.toast('开通失败',false);
          fundUserApi.getFundUserInfo().then(res=>{
            this.firstLoadUserInfo();
          });
        }
      })
    }else{
      this.toast('未获取用户id',false);
      this.setData({
        creatStockAccountButtonDisable:false
      })
      console.log('获取用户id失败');
    }
  },

  //查询自己的股票账户信息
  getMyStockAccountInfo:function(){
    wx.showLoading({
      title: '加载中',
    })
    const DB = wx.cloud.database();
    DB.collection('stock').where({
      userid:app.globalData.userId
    }).limit(1).get({
      success:res=>{
        wx.hideLoading();
        if(res.data.length>0){
          this.setData({
            accountCash:res.data[0].cash,
            accountCapital:res.data[0].capital,
            stockDealRecordsAry:res.data[0].stock_deal_records,
            hasstockaccount:true
          })
          this.getCanAccountUpgrade(res.data[0].capital);
          this.makeStockObj(res.data[0].stock_bonds,res.data[0].stock_focus,res.data[0].stock_deal_records);
        }else{
          this.initData();
          this.toast('未查到账户信息',false);
          console.log("查询不到模拟盘用户信息");
        }
      },
      fail:res=>{
        this.initData();
        this.toast('查询失败',false);
        console.log("获取云数据失败");
        wx.hideLoading();
      },
    })
  },

  //根据股票账户持仓股票关注股票以及交易记录里包含的股票生成一个股票信息对象保存本地供查询
  makeStockObj:function(bondsAry,focusAry,recordAry){
    const allStockIdAry = [];
    if(recordAry.length>0 || bondsAry.length>0 || focusAry.length>0){
      if(recordAry.length>0){
        for(let i=0;i<recordAry.length;i++){
          if(allStockIdAry.includes(recordAry[i].id)){
            continue;
          }else{
            allStockIdAry.push(recordAry[i].id);
          }
        }
      }
      if(bondsAry.length>0){
        for(let i=0;i<bondsAry.length;i++){
          if(allStockIdAry.includes(bondsAry[i].id)){
            continue;
          }else{
            allStockIdAry.push(bondsAry[i].id);
          }
        }
      }
      if(focusAry.length>0){
        for(let i=0;i<focusAry.length;i++){
          if(allStockIdAry.includes(focusAry[i])){
            continue;
          }else{
            allStockIdAry.push(focusAry[i]);
          }
        }
      }
      wx.showLoading({
        title: '加载中',
      })
      getStockInfoFromNetEase.getChinaStockInfo(allStockIdAry).then(res=>{
        if(res){
          this.setData({
            stockObj:res
          })
          this.makeBondsStockObj(bondsAry);
          this.makeFocusStockAry(focusAry);
        }else{
          this.toast('获取数据失败',false);
          console.log('获取网易股票实时数据失败');
        }
        wx.hideLoading();
      })
    }else{
      this.setData({
        bondsStockAry:[],
        focusStockAry:[],
        stockDealRecordsAry:[],
        accountStockValue:0,
        accountTotalValue:this.data.accountCash,
        accountPosition:'空仓',
        accountYields:this.getAccountYields(0,this.data.accountCash,this.data.accountCapital),
        accountWin:this.data.accountCash>this.data.accountCapital,
        stockObj:{},
        canBondsAllClear:false,
      })
    }
  },

  //根据股票账户持仓生成持有股票数组并计算市值
  makeBondsStockObj:function(array){
    const length = array.length;
    const stockDealRecordsAry = this.data.stockDealRecordsAry;
    const stockObj = this.data.stockObj;
    let stockTotalValue = 0;
    if(length>0){
      let allClearDisable = false;
      for(let i=0;i<length;i++){
        array[i].costTotal = 0;
        array[i].canNotSellAmount = 0;
        for(let j=0;j<stockDealRecordsAry.length;j++){
          if(stockDealRecordsAry[j].id == array[i].id){
            const date = new Date(stockDealRecordsAry[j].time);
            array[i].costTotal += stockDealRecordsAry[j].price*stockDealRecordsAry[j].amount;
            if(stockDealRecordsAry[j].buy&&this.checkDateIsToday(date)){
              array[i].canNotSellAmount += stockDealRecordsAry[j].amount;
              //只要当天有买入股票便不能使用一键清仓
              if(stockDealRecordsAry[j].amount>0){
                allClearDisable = true;
              }
            }
          }
        }
        array[i].symbol = stockObj[array[i].id].symbol;
        array[i].name = stockObj[array[i].id].name;
        array[i].price = stockObj[array[i].id].price;
        array[i].rate = this.getIncreaseRate(stockObj[array[i].id].percent);
        array[i].value = Number(Number(stockObj[array[i].id].price)*Number(array[i].bonds)).toFixed(0);
        array[i].cost = Number(array[i].costTotal/array[i].bonds).toFixed(2);
        array[i].canSell = Number(array[i].bonds) - Number(array[i].canNotSellAmount);
        array[i].benefit = Number(Number(array[i].value) - array[i].costTotal).toFixed(0);
        array[i].benefitRate = this.getIncreaseRate(Number((Number(array[i].benefit)/array[i].costTotal)));
        array[i].win = Number(array[i].benefit)>0;
        stockTotalValue += Number(array[i].value);
        if(stockObj[array[i].id].bid1==0){
          allClearDisable = true;
        }
      }
      this.setData({
        accountStockValue:Number(stockTotalValue.toFixed(0)),
        accountTotalValue:Number(stockTotalValue.toFixed(0)) + this.data.accountCash,
        accountPosition:this.getAccountPosition(stockTotalValue,this.data.accountCash),
        accountYields:this.getAccountYields(stockTotalValue,this.data.accountCash,this.data.accountCapital),
        accountWin:stockTotalValue+this.data.accountCash-this.data.accountCapital>0,
        bondsStockAry:array,
        canBondsAllClear:!allClearDisable,
      })
    }else{
      this.setData({
        accountStockValue:0,
        accountTotalValue:this.data.accountCash,
        accountPosition:'空仓',
        accountYields:this.getAccountYields(stockTotalValue,this.data.accountCash,this.data.accountCapital),
        accountWin:this.data.accountCash>this.data.accountCapital,
        bondsStockAry:[],
        canBondsAllClear:false,
      })
      console.log('持仓股票代码数组为空');
    }
  },

  //传入股票日期查询是否今日购买，是的话返回true
  checkDateIsToday:function(date){
    const today = new Date()
    return (today.getDate()==date.getDate())&&(today.getMonth()==date.getMonth())&&(today.getFullYear()==date.getFullYear());
  },

  //根据网易数据接口生成的股票数据合成本地关注股票数组
  makeFocusStockAry:function(array){
    const stockObj = this.data.stockObj;
    const focusStockAry = [];
    if(array.length>0){
      for(let i=0;i<array.length;i++){
        focusStockAry.push({
          id:array[i],
          symbol:stockObj[array[i]].symbol,
          name:stockObj[array[i]].name,
          rate:this.getIncreaseRate(stockObj[array[i]].percent),
          price:stockObj[array[i]].price,
          open:stockObj[array[i]].open,
          high:stockObj[array[i]].high,
          low:stockObj[array[i]].low,
          percent:stockObj[array[i]].percent,
        })
      }
      this.setData({
        focusStockAry:focusStockAry
      })
    }else{
      this.setData({
        focusStockAry:[],
      })
      console.log('关注股票代码数组为空');
    }
  },

  //查询模拟盘账户是否可以升级，可以的话Tab个人页面弹出红点
  getCanAccountUpgrade:function(capital){
    const contribution = app.globalData.fundUserInfo.contribution;
    let canUpgrade = false;
    if(contribution>=10000&&capital<100000000){
      canUpgrade = true;
    }else if(contribution>=5000&&capital<50000000){
      canUpgrade = true;
    }else if(contribution>=2500&&capital<10000000){
      canUpgrade = true;
    }
    if(canUpgrade){
      wx.setTabBarBadge({
        index:3,
        text:'UP'
      })
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

  //点击关注股票列表进入股票筛选组件
  clickFocusStock:function(e){
    const sid = e.currentTarget.dataset.id;
    this.setData({
      openType:1,
      stockRequestId:this.data.focusStockAry[sid].id,
      showStockPicker:true
    })
  },

  //点击关注股票列表进入股票筛选组件
  clickBondsStock:function(e){
    const sid = e.currentTarget.dataset.id;
    this.setData({
      openType:1,
      stockRequestId:this.data.bondsStockAry[sid].id,
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
            stockDealRecordsAry:res.result.data[0].stock_deal_records
          })
          this.makeStockObj(res.result.data[0].stock_bonds,res.result.data[0].stock_focus,res.result.data[0].stock_deal_records);
        }else{
          this.initData();
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
    if(this.data.hasstockaccount){
      this.getMyStockAccountInfo();
    }else{
      this.initData();
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
      }
    })
  },

    //把股票对象数组变成只有股票id的数组
    getIdAryFromFocusAry:function(array){
      const idAry = [];
      for(let i=0;i<array.length;i++){
        idAry.push(array[i].id);
      }
      return idAry;
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
    if(e.detail){
      this.getMyStockAccountInfo();
    }
  },

  //接受股票组件回传添加关注股票
  getFocusStockObj:function(e){
    const idAry = this.getIdAryFromFocusAry(this.data.focusStockAry);
    const stockObj = this.data.stockObj;
    idAry.push(e.detail.code);
    stockObj[e.detail.code] = e.detail;
    this.setData({
      stockObj:stockObj
    })
    this.makeFocusStockAry(idAry);
  },

  //接受股票组件回传取消关注股票
  getCancelFocusStockId:function(e){
    const idAry = this.getIdAryFromFocusAry(this.data.focusStockAry);
    let deleteIndex = -1;
    for(let i=0;i<idAry.length;i++){
      if(e.detail == idAry[i]){
        deleteIndex = i;
        break;
      }
    }
    if(deleteIndex>=0){
      idAry.splice(deleteIndex,1);
      this.makeFocusStockAry(idAry);
    }
  },

  //提示框方法
  toast:function(title,isSuccess){
    const icon = isSuccess?'success':'error';
    wx.showToast({
      title: title,
      icon:icon,
      duration:2000
    })
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
  },

})