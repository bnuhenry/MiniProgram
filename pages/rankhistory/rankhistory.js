// pages/rankhistory/rankhistory.js
Page({
  // 页面的初始数据
  data: {
    userInfoObj:Object,
    userId:'',
    fundRankHistoryAry:Array,
    fundRankHistoryDateAry:Array,
    userPositionHistoryAry:[],
    rankHistoryDate:'',
    showDataAry:[],
    replayDisable:true,
    stopPlayDisable:false,
    playRankHistoryTimer:Number,
  },

  // 生命周期函数--监听页面加载
  onLoad: function () {
    const that = this;
    const eventChannel = this.getOpenerEventChannel()
    eventChannel.on('userInfoObjFromRankPage', function(userInfoObj) {
      that.setData({
        userInfoObj:userInfoObj
      })
    })
    eventChannel.on('userIdFromRankPage', function(userId) {
      that.setData({
        userId:userId
      })
    })
    eventChannel.on('fundRankHistoryAryFromRankPage', function(fundRankHistoryAry) {
      that.setData({
        fundRankHistoryAry:fundRankHistoryAry
      })
      that.makeRankHistoryDateAry(fundRankHistoryAry);
    })
  },

  // 生命周期函数--监听页面显示
  onShow: function () {
    this.playTheHistoryAnimation();
  },

  // 生命周期函数--监听页面隐藏
  onHide:function(){
    this.stopPlayHistoryAnimation();
  },

  // 生命周期函数--监听页面销毁
  onUnload:function(){
    this.stopPlayHistoryAnimation();
  },

  //播放动画
  playTheHistoryAnimation:function(){
    this.setData({
      replayDisable:true,
      stopPlayDisable:false,
    })
    let i = this.data.fundRankHistoryAry.length - 1;
    this.data.playRankHistoryTimer = setInterval(() => {
      if(i>=0){
        this.makeShowDataAry(this.data.fundRankHistoryAry[i].ranklist);
        this.makeUserPositionHistoryAry(this.data.fundRankHistoryAry[i].ranklist);
        this.setData({
          rankHistoryDate:this.getRankHistoryDate(this.data.fundRankHistoryAry[i].time)
        })
        i--;
      }else{
        i = this.data.fundRankHistoryAry.length - 1;
        this.resetAnimation();
      }
    }, 1500);
  },

  //停止播放动画
  stopPlayHistoryAnimation:function(){
    clearInterval(this.data.playRankHistoryTimer);
    this.setData({
      replayDisable:false,
      stopPlayDisable:true,
    })
  },

  //重播动画时重置数据
  resetAnimation:function(){
    this.data.userPositionHistoryAry = [];
    const userObj = this.data.userInfoObj;
    for(let keys in userObj){
      userObj[keys].startShow = false;
    }
    this.setData({
      userInfoObj:userObj
    })
  },

  //根据传递数组建立渲染的数组
  makeShowDataAry:function(dataAry){
    const showDataAry = [];
    const needToPushIndex = [];
    for(let i=0;i<dataAry.length;i++){
      let index = i;
      let rankIndexChange = 0;
      if(this.data.userInfoObj[dataAry[i].userid].startShow){
        rankIndexChange = i - this.data.userInfoObj[dataAry[i].userid].lastIndex
        index = this.data.userInfoObj[dataAry[i].userid].lastIndex;
      }else if(dataAry.length>this.data.showDataAry.length&&this.data.showDataAry.length>0){
        needToPushIndex.push(i);
      }
      showDataAry[index] = {
        name:this.data.userInfoObj[dataAry[i].userid].name,
        rankChange:rankIndexChange,
        yields:dataAry[i].yields,
        yieldsStr:this.getAccountYields(dataAry[i].stockValue,dataAry[i].cash,dataAry[i].capital),
        style:this.getUserHistogramStyle(dataAry[i].yields),
        avatarUrl:this.data.userInfoObj[dataAry[i].userid].avatarUrl,
        isMyAccount:dataAry[i].userid == this.data.userId,
        tiktok:this.getRankHistoryAnimation(rankIndexChange,dataAry[i].yields),
        userId:dataAry[i].userid,
        isNewFish:false,
      }
      this.data.userInfoObj[dataAry[i].userid].indexChange = rankIndexChange;
      this.data.userInfoObj[dataAry[i].userid].lastIndex = index;
      this.data.userInfoObj[dataAry[i].userid].startShow = true; 
    }
    //若排名历史有新增成员则先推入数组末尾
    if(needToPushIndex.length > 0){
      needToPushIndex.forEach(item =>{
        let rankIndexChange = item - (showDataAry.length);
        showDataAry.push({
          name:this.data.userInfoObj[dataAry[item].userid].name,
          rankChange:rankIndexChange,
          yields:dataAry[item].yields,
          yieldsStr:this.getAccountYields(dataAry[item].stockValue,dataAry[item].cash,dataAry[item].capital),
          style:this.getUserHistogramStyle(dataAry[item].yields),
          avatarUrl:this.data.userInfoObj[dataAry[item].userid].avatarUrl,
          isMyAccount:dataAry[item].userid == this.data.userId,
          tiktok:this.getRankHistoryAnimation(rankIndexChange,dataAry[item].yields),
          userId:dataAry[item].userid,
          isNewFish:true,
        })
        this.data.userInfoObj[dataAry[item].userid].indexChange = rankIndexChange;
        this.data.userInfoObj[dataAry[item].userid].lastIndex = showDataAry.length - 1;
        this.data.userInfoObj[dataAry[item].userid].startShow = true; 
      })
    }
    // console.log(dataAry)
    // console.log(showDataAry)
    this.setData({
      showDataAry:showDataAry
    })
  },

  //根据排名历史数据生成可供选择的日期数组
  makeRankHistoryDateAry:function(historyAry){
    const length = historyAry.length;
    const dateAry = [];
    for(let i=0;i<length;i++){
      dateAry.push(this.getRankHistoryDate(historyAry[i].time))
    }
    this.setData({
      fundRankHistoryDateAry:dateAry
    })
  },

  //获取账户总收益率
  getAccountYields:function(stock,cash,capital){
    const upOrDown = (cash + stock - capital)>0?'+':'-';
    const yields = Math.abs(cash + stock - capital);
    return upOrDown + Number((yields*100)/capital).toFixed(2) + '%';
  },

  //获取历史记录时间生成日期
  getRankHistoryDate:function(time){
    const date = new Date(time);
    return date.getFullYear() +'年'+(date.getMonth()+1)+'月'+date.getDate()+'日'+date.getHours()+':'+date.getMinutes();
  },

  //根据收益率生成柱状图渲染样式
  getUserHistogramStyle:function(yields){
    const color = yields>0?'#FF3232':'#00E600';
    return 'background-color:'+color+';';
  },

  //排名柱状图上下摇摆左右伸缩动画创建
  getRankHistoryAnimation:function(rankChange,yields){
    const animation = wx.createAnimation({
      duration: 1500,
      timingFunction: 'ease-out',
    });
    if(rankChange == 0){
      animation.width(Math.abs(yields)*375+'rpx').step()
    }else{
      animation.translateY(rankChange*80+'rpx').width(Math.abs(yields)*375+'rpx').step()
    }
    return animation.export();
  },

  //仓位柱状图上下伸缩动画创建
  getPositionHistoryAnimation:function(position){
    const animation = wx.createAnimation({
      duration: 1500,
      timingFunction: 'ease-out',
    });
    animation.height(position*100+'%').step()
    return animation.export();
  },

  //根据历史记录生成用户仓位柱状图
  makeUserPositionHistoryAry:function(rankAry){
    let userPositionAry = [];
    if(this.data.userPositionHistoryAry.length <= 0){
      for(let i = 0;i<rankAry.length;i++){
        let position = rankAry[i].stockValue/rankAry[i].totalValue;
        userPositionAry.push({
          userId:rankAry[i].userid,
          avatarUrl:this.data.userInfoObj[rankAry[i].userid].avatarUrl,
          positionStr:this.getAccountPosition(position),
          histoAni:this.getPositionHistoryAnimation(position),
        })
      }
    }else{
      userPositionAry = this.data.userPositionHistoryAry;
      for(let i = 0;i<rankAry.length;i++){
        let canFindUser = false;
        let position = rankAry[i].stockValue/rankAry[i].totalValue;
        for(let j=0;j<userPositionAry.length;j++){
          if(rankAry[i].userid == userPositionAry[j].userId){
            const position = rankAry[i].stockValue/rankAry[i].totalValue;
            userPositionAry[j].histoAni = this.getPositionHistoryAnimation(position);
            userPositionAry[j].positionStr = this.getAccountPosition(position);
            canFindUser = true;
            break;
          }
        }
        if(!canFindUser){
          userPositionAry.push({
            userId:rankAry[i].userid,
            avatarUrl:this.data.userInfoObj[rankAry[i].userid].avatarUrl,
            histoAni: this.getPositionHistoryAnimation(position),
            positionStr:this.getAccountPosition(position)
          })
        }
      }
    }
    this.setData({
      userPositionHistoryAry:userPositionAry
    })
  },

  //获取仓位字符串
  getAccountPosition:function(position){
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

})