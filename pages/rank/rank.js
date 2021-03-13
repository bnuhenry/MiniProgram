const app = getApp()
const getStockInfoFromNetEase = require("../../utils/stockApi.js")
const getFundRankInfo = require("../../utils/fundRank.js")

Page({

  /**
   * 页面的初始数据
   */
  data: {
    userId:String,
    fundSlogan:'',
    userInfoObj:{},
    showDataAry:[],
    refreshRankDisable:false,
    fundRankHistoryAry:[],
    fundRankHistoryDateAry:[],
    gotRankHistory:false,
    showHistoryDatePicker:false,
    rankListDate:'目前最新',
  },


  // 生命周期函数--监听页面加载
  onLoad: function (options) {
    const eventChannel = this.getOpenerEventChannel();
    eventChannel.on('requestUserId', data=> {
      this.setData({
        userId:data.userId,
        fundSlogan:app.globalData.fundSloganInfo.words
      })
    })
    this.getStockUserAry();
  },

  // 生命周期函数--监听页面显示
  onShow:function(){
    if(!this.data.gotRankHistory){
      this.getFundRankHistoryInfo();
    }
  },

  //获取所有证券账户信息并按收益排名
  getStockUserAry:function(){
    wx.showLoading({
      title: '加载中',
    })
    const DB = wx.cloud.database();
    const _ = DB.command;
    wx.cloud.callFunction({
      name:'stock_rank_show',
      data: {
        action: 'stockrank'
      },
      complete:res=>{
        if(res.result.list.length>0){
          this.makeUserInfoObj(res.result.list);
          this.getStockInfoList(res.result.list);
          console.log("查询排名榜成功");
        }else{
          console.log('没有发现存在用户数据');
        }
        wx.hideLoading();
      }
    })
  },

  //从云端查询所有证券账户信息后筛选出所有持仓股票代码
  makeStockIdAry:function(dataAry){
    const stockIdAry = [];
    for(let i=0;i<dataAry.length;i++){
      for(let j=0;j<dataAry[i].stock_bonds.length;j++){
        if(dataAry[i].stock_bonds[j].id in stockIdAry){
          break;
        }else{
          stockIdAry.push(dataAry[i].stock_bonds[j].id);
        }
      }
    }
    return stockIdAry;
  },
  
  //根据云端请求的用户信息含有的持仓股票代码请求网易股票接口查询信息
  getStockInfoList:function(dataAry){
    const length = dataAry.length;
    let stockObj = {};
    const array = this.makeStockIdAry(dataAry);
    if(length>0){
      getStockInfoFromNetEase.getChinaStockInfo(array).then(res=>{
        if(res){
          stockObj = res;
          for(let i=0;i<dataAry.length;i++){
            dataAry[i].stockValue = 0;
            if(dataAry[i].stock_bonds.length){
              for(let j=0;j<dataAry[i].stock_bonds.length;j++){
                dataAry[i].stockValue += Number(dataAry[i].stock_bonds[j].bonds)*Number(stockObj[dataAry[i].stock_bonds[j].id].price);
              }
            }
            dataAry[i].stockValueStr = Number(dataAry[i].stockValue).toFixed(0);
            dataAry[i].yieldsStr = this.getAccountYields(dataAry[i].stockValue,dataAry[i].cash,dataAry[i].capital);
            dataAry[i].yields = (dataAry[i].stockValue+dataAry[i].cash-dataAry[i].capital)/dataAry[i].capital;
            dataAry[i].position = this.getAccountPosition(dataAry[i].stockValue,dataAry[i].cash);
            dataAry[i].totalValue = Number(dataAry[i].stockValue+dataAry[i].cash).toFixed(0);
            dataAry[i].rankName = getFundRankInfo.getFundRankInfo(dataAry[i].contribution).rankName;
            dataAry[i].win = dataAry[i].totalValue>dataAry[i].capital?true:false;
            dataAry[i].isMyAccount = dataAry[i].userid == this.data.userId;
          }
          this.makeDataAry(dataAry);
        }else{
          console.log('没有返回任何股票信息');
        }
      })
    }else{
      console.log('股票代码数组为空');
    }
  },

  //根据云端和网易股票数据返回的数组进行排序
  makeDataAry:function(dataAry){
    dataAry.sort((a,b)=>b.yields-a.yields);
    this.setData({
      showDataAry:dataAry
    })
  },

  //获取账户总收益率
  getAccountYields:function(stock,cash,capital){
    const upOrDown = (cash + stock - capital)>0?'+':'-';
    const yields = Math.abs(cash + stock - capital);
    return upOrDown + Number((yields*100)/capital).toFixed(2) + '%';
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

  //点击用户信息查看股票模拟盘账户
  checkThisStockAccount:function(e){
    const uid = e.currentTarget.dataset.uid;
    const userObj = {
      avatarUrl:this.data.showDataAry[uid].avatarUrl,
      name:this.data.showDataAry[uid].name,
      _id:this.data.showDataAry[uid].userid
    }
    const eventChannel = this.getOpenerEventChannel();
    eventChannel.emit('receiveUserObjFromRankPage', userObj);
    wx.navigateBack();
  },

  //点击刷新排名
  refreshStockRank:function(){
    this.setData({
      refreshRankDisable:true,
      rankListDate:'目前最新'
    })
    this.getStockUserAry();
    setTimeout(()=>{
      this.setData({
        refreshRankDisable:false
      })
    },5000)
  },

  //查询云端历史排名记录
  getFundRankHistoryInfo:function(){
    wx.cloud.callFunction({
      name:'stock_rank_show',
      data: {
        action: 'stockrankhistory',
        start_time: 0
      },
      complete:res=>{
        if(res.result.data.length>0){
          this.setData({
            fundRankHistoryAry:res.result.data
          })
          this.makeRankHistoryDateAry(res.result.data);
        }else{
          console.log('获取基金会模拟盘历史排名信息失败');
        }
      }
    })
  },

  //根据返回的排名历史数据生成可供选择的日期数组
  makeRankHistoryDateAry:function(historyAry){
    const length = historyAry.length;
    const dateAry = [];
    for(let i=0;i<length;i++){
      dateAry.push(this.getRankHistoryDate(historyAry[i].time))
    }
    this.setData({
      fundRankHistoryDateAry:dateAry,
      gotRankHistory:true,
      showHistoryDatePicker:true
    })
    
  },

  //历史排名日期选择器监听变化
  bindRankHisDateChange:function(e){
    const index = Number(e.detail.value);
    this.setData({
      rankListDate:this.data.fundRankHistoryDateAry[index]
    })
    this.makeRankHistoryAry(this.data.fundRankHistoryAry[index]);
  },

  //实现查询历史排名不用访问云端新建一个本地储存用户数据对象方法
  makeUserInfoObj:function(array){
    const length = array.length;
    let userObj = new Object();
    for(let i=0;i<length;i++){
      userObj[array[i].userid] = array[i];
    }
    this.setData({
      userInfoObj:userObj
    })
  },

  //获取历史记录对象生成排名列表
  makeRankHistoryAry:function(rankHisObj){
    const rankHisAry = rankHisObj.ranklist;
    const length = rankHisAry.length;
    for(let i=0;i<length;i++){
      rankHisAry[i].name = this.data.userInfoObj[rankHisAry[i].userid].name;
      rankHisAry[i].avatarUrl = this.data.userInfoObj[rankHisAry[i].userid].avatarUrl;
      rankHisAry[i].stockValueStr = rankHisAry[i].stockValue;
      rankHisAry[i].position = this.getAccountPosition(rankHisAry[i].stockValue,rankHisAry[i].cash);
      rankHisAry[i].rankName = getFundRankInfo.getFundRankInfo(this.data.userInfoObj[rankHisAry[i].userid].contribution).rankName;
      rankHisAry[i].yieldsStr = this.getYieldsToString(rankHisAry[i].yields);
      rankHisAry[i].win = rankHisAry[i].yields>0;
      rankHisAry[i].isMyAccount = rankHisAry[i].userid == this.data.userId;
    }
    this.makeDataAry(rankHisAry);
  },

  //获取历史记录时间生成日期
  getRankHistoryDate:function(time){
    const date = new Date(time);
    return date.getFullYear() +'年'+(date.getMonth()+1)+'月'+date.getDate()+'日'+date.getHours()+':'+date.getMinutes();
  },

  //历史排名记录直接通过yields返回字符串模板
  getYieldsToString:function(yields){
    const upOrDown = yields>0?'+':'-';
    const yieldsAbs = Math.abs(yields);
    return upOrDown + Number(yieldsAbs*100).toFixed(2) + '%';
  },

  //点击历史排名
  checkRankHistory:function(){
    if(!this.data.gotRankHistory){
      this.getFundRankHistoryInfo();
    }
  },

  //点击历史排名显示柱状图
  clickCheckRankHistogram:function(){
    const that = this;
    wx.navigateTo({
      url: '../rankhistory/rankhistory',
      success: function(res) {
        // 通过eventChannel向被打开页面传送数据
        res.eventChannel.emit('userInfoObjFromRankPage', that.data.userInfoObj);
        res.eventChannel.emit('fundRankHistoryAryFromRankPage', that.data.fundRankHistoryAry);
        res.eventChannel.emit('userIdFromRankPage', that.data.userId);
      }
    })
  },

})