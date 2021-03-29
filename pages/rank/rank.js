const app = getApp()
const getStockInfoFromNetEase = require("../../utils/stockApi.js")
const getFundRankInfo = require("../../utils/fundRank.js")

Page({
  // 页面的初始数据
  data: {
    userInfoObj:{},
    fundNameObj:{},
    showDataAry:[],
    refreshRankDisable:false,
    fundRankHistoryAry:[],
    fundRankHistoryDateAry:[],
    gotRankHistory:false,
    gotFundUserObj:false,
    gotFundNameObj:false,
    showHistoryDatePicker:false,
    rankListDate:'目前最新',
  },


  // 生命周期函数--监听页面加载
  onLoad: function (options) {
    this.getStockUserAry();
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
  },

  // 生命周期函数--监听页面显示
  onShow:function(){
  },

  //获取所有证券账户信息并按收益排名
  getStockUserAry:function(){
    wx.showLoading({
      title: '加载中',
    })
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
          if(!this.data.gotRankHistory){
            this.getFundRankHistoryInfo();
          }
          if(!this.data.gotFundNameObj){
            this.getUserFundName(res.result.list);
          }
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
            const rankObj = getFundRankInfo.getFundRankInfo(dataAry[i].contribution);
            dataAry[i].stockValueStr = Number(dataAry[i].stockValue).toFixed(0);
            dataAry[i].yieldsStr = this.getAccountYields(dataAry[i].stockValue,dataAry[i].cash,dataAry[i].capital);
            dataAry[i].yields = (dataAry[i].stockValue+dataAry[i].cash-dataAry[i].capital)/dataAry[i].capital;
            dataAry[i].position = this.getAccountPosition(dataAry[i].stockValue,dataAry[i].cash);
            dataAry[i].totalValue = Number(dataAry[i].stockValue+dataAry[i].cash).toFixed(0);
            dataAry[i].rankName = rankObj.rankName;
            dataAry[i].rankImage = rankObj.rankImage;
            dataAry[i].win = dataAry[i].totalValue>dataAry[i].capital?true:false;
            dataAry[i].isMyAccount = dataAry[i].userid == app.globalData.fundUserInfo._id;
            dataAry[i].fundName = this.data.fundNameObj[dataAry[i].fund]?this.data.fundNameObj[dataAry[i].fund]:'散户';
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

  //查询排名用户的所属基金会名字
  getUserFundName:function(dataAry){
    const fundAry = [];
    for(let i = 0;i < dataAry.length;i++){
      if(!fundAry.includes(dataAry[i].fund)){
        fundAry.push(dataAry[i].fund)
      }
    }
    wx.cloud.callFunction({
      name:'stock_rank_show',
      data:{
        action:'stockRankUserFund',
        fundAry:fundAry
      },
      success:res=>{
        if(res.result.data.length>0){
          this.makeFundNameObj(res.result.data);
        }else{
          console.log('查不到任何基金会信息')
        }
      },
      fail:res=>{
        console.log(res);
      }
    })
  },

  //根据查询基金会名字请求返回的数组生成基金会名字对象
  makeFundNameObj:function(fundAry){
    const fundNameObj = {};
    for(let i = 0;i<fundAry.length;i++){
      fundNameObj[fundAry[i].fund] = fundAry[i].fund_name;
    }
    this.setData({
      fundNameObj:fundNameObj,
      gotFundNameObj:true
    })
    this.getAccountFundName(fundNameObj);
  },

  //获取基金会名字
  getAccountFundName:function(fundNameObj){
    const showDataAry = this.data.showDataAry;
    for(let i = 0;i < showDataAry.length;i++){
      showDataAry.fundName = fundNameObj[showDataAry[i].fund]?fundNameObj[showDataAry[i].fund]:'散户'
    }
    for(let keys in this.data.userInfoObj){
      this.data.userInfoObj[keys].fundName = fundNameObj[this.data.userInfoObj[keys].fund]?fundNameObj[this.data.userInfoObj[keys].fund]:'散户';
    }
    this.setData({
      showDataAry:showDataAry
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
    console.log('查询历史排名');
    wx.cloud.callFunction({
      name:'stock_rank_show',
      data: {
        action: 'stockrankhistory',
        start_time: 0
      },
      complete:res=>{
        if(res.result.data.length>0){
          this.data.fundRankHistoryAry = res.result.data;
          this.data.gotRankHistory = true;
          this.makeRankHistoryDateAry(res.result.data);
          if(this.data.gotFundUserObj){
            //检测主力是否有加减仓
            this.detectBossPosition();
          }
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
      showHistoryDatePicker:true
    })
  },

  // 检测主力仓位近5日是否有变化
  detectBossPosition:function(){
    const bossUserId = '28ee4e3e6033cf7706f73fb97d0b7795';
    const historyAry = this.data.fundRankHistoryAry;
    const bossPositionAry = [];
    const positionChangeAry = [];
    for(let i=4;i>=0;i--){
      for(let j=0;j<historyAry[i].ranklist.length;j++){
        if(historyAry[i].ranklist[j].userid == bossUserId){
          bossPositionAry.push({
            position:this.getUserPositionNumber(historyAry[i].ranklist[j].stockValue,historyAry[i].ranklist[j].cash),
            time:historyAry[i].time
          })
          break;
        }
      }
    }
    for(let x=0;x<this.data.showDataAry.length;x++){
      if(this.data.showDataAry[x].userid == bossUserId){
        bossPositionAry.push({
          position:this.getUserPositionNumber(this.data.showDataAry[x].stockValue,this.data.showDataAry[x].cash),
          time:Date.now()
        })
        break;
      }
    }
    for(let y = 0;y<bossPositionAry.length-1;y++){
      let positionChange = this.getUserPositionChange(bossPositionAry[y].position,bossPositionAry[y+1].position);
      if(positionChange){
        positionChangeAry.push({
          change:positionChange,
          sell:bossPositionAry[y].position - bossPositionAry[y+1].position > 0,
          bossName:this.data.userInfoObj[bossUserId].name,
          bossAvatar:this.data.userInfoObj[bossUserId].avatarUrl,
          dealTime:this.getStockDealTime(bossPositionAry[y+1].time)
        })
      }
    }
    if(positionChangeAry.length>0){
      this.setData({
        bossPositionChangeAry:positionChangeAry
      })
      console.log(positionChangeAry)
    }else{
      positionChangeAry.push({
        change:'没有加仓减仓',
        sell:true,
        bossName:this.data.userInfoObj[bossUserId].name,
        bossAvatar:this.data.userInfoObj[bossUserId].avatarUrl,
        dealTime:'近五日'
      })
      this.setData({
        bossPositionChangeAry:positionChangeAry
      })
      console.log('主力最近无加减仓')
    }
  },

  //获取仓位数值
  getUserPositionNumber:function(stock,cash){
    const position = stock/(cash+stock);
    return position;
  },

  //获取仓位数值差额返回字符串描述
  getUserPositionChange:function(position,newPosition){
    const positionChange = newPosition - position;
    const buyOrSell = positionChange >0?'加仓':'减仓';
    const amount = Math.abs(positionChange);
    let amountStr = Math.floor(amount*10) + '成';
    if(amount>=0.9){
      if(buyOrSell){
        return '满仓梭哈';
      }else{
        return '全部清仓';
      }
    }else if(amount<0.9 && amount>=0.1){
      return buyOrSell + amountStr;
    }else{
      return null;
    }
  },

  //根据时间戳生成交易时间
  getStockDealTime:function(time){
    const date = new Date(time);
    return (date.getMonth()+1)+'月'+date.getDate()+'日';
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
    this.data.userInfoObj = userObj;
    this.data.gotFundUserObj = true;
    if(this.data.gotRankHistory){
      //检测主力是否有加减仓
      this.detectBossPosition();
    }
  },

  //获取历史记录对象生成排名列表
  makeRankHistoryAry:function(rankHisObj){
    const rankHisAry = rankHisObj.ranklist;
    const length = rankHisAry.length;
    for(let i=0;i<length;i++){
      const rankObj = getFundRankInfo.getFundRankInfo(this.data.userInfoObj[rankHisAry[i].userid].contribution);
      rankHisAry[i].name = this.data.userInfoObj[rankHisAry[i].userid].name;
      rankHisAry[i].avatarUrl = this.data.userInfoObj[rankHisAry[i].userid].avatarUrl;
      rankHisAry[i].stockValueStr = rankHisAry[i].stockValue;
      rankHisAry[i].position = this.getAccountPosition(rankHisAry[i].stockValue,rankHisAry[i].cash);
      rankHisAry[i].rankName = rankObj.rankName;
      rankHisAry[i].rankImage = rankObj.rankImage;
      rankHisAry[i].fundName = this.data.userInfoObj[rankHisAry[i].userid].fundName;
      rankHisAry[i].yieldsStr = this.getYieldsToString(rankHisAry[i].yields);
      rankHisAry[i].win = rankHisAry[i].yields>0;
      rankHisAry[i].isMyAccount = rankHisAry[i].userid == app.globalData.fundUserInfo._id;
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
        res.eventChannel.emit('userIdFromRankPage', app.globalData.fundUserInfo._id);
      }
    })
  },

})