// pages/schedule/schedule.js
const app = getApp()

Page({
  // 页面的初始数据
  data: {
    userFund:'other',
    showDateAry:[],
    scheduleAry:[],
    showScheduleAry:[],
    year:new Date().getFullYear(),
    month:new Date().getMonth(),
    day:new Date().getDate(),
    showDatePicker:false,
    showEditor:false,
    editType:0,
    selectedIndex:-1,
    scheduleObj:{},
    showScheduleDetail:false,
    topOptionSelected:1,
    touchPointX:Number,
  },


  // 生命周期函数--监听页面加载
  onLoad: function (options) {
    this.makeDaysAry(this.data.month,this.data.year);
  },

  onShow:function(){
    if (app.globalData.gotFundInfo){
      this.getUserInfo();
    }else{
      wx.showToast({
        title: '请登录',
        icon:'error',
        duration:2000
      })
    }
  },

  //顶部点击全部选项,topOptionSelected为1
  selectOptionAll:function(){
    if(this.data.topOptionSelected!=1){
      this.setData({
        topOptionSelected:1
      })
      this.injectScheduleToAry();
    }
  },

    //顶部点击我的选项,topOptionSelected为0
    selectOptionMy:function(){
      if(this.data.topOptionSelected!=0){
        this.setData({
          topOptionSelected:0
        })
        this.injectScheduleToAry();
      }
    },

  //拿到用户信息包括name和id，然后请求云端日程数据
  getUserInfo:function(){
    this.setData({
      userId: app.globalData.userId,
      userName: app.globalData.fundUserInfo.name,
      userAvatar: app.globalData.fundUserInfo.avatarUrl,
      userFund: app.globalData.fundUserInfo.fund,
    })
    this.getSchedule();
  },

  //日期选定后生成渲染二维数组
  makeDaysAry:function(month,year){
    let date = new Date();
    const now = new Date();
    date.setFullYear(year);
    date.setMonth(month);
    date.setDate(1);
    const daysAry = [];
    const monthAry = [];
    const daysInMonth = this.getDaysInMonth(month,year);
    const weekDay = date.getDay();
    const restDay = 42 - (weekDay + daysInMonth);
    for(let i=0;i<weekDay;i++){
      let dayObj = {
        day:'',
        scheduleAry:[],
        isToday:false
      }
      daysAry.push(dayObj);
    }
    for(let i=1;i<=daysInMonth;i++){
      if(now.getFullYear()==year&&now.getMonth()==month&&now.getDate()==i){
        let dayObj = {
          day:i,
          scheduleAry:[],
          isToday:true
        }
        daysAry.push(dayObj);
      }else{
        let dayObj = {
          day:i,
          scheduleAry:[],
          isToday:false
        }
        daysAry.push(dayObj);
      }
    }
    for(let i=0;i<restDay;i++){
      let dayObj = {
        day:'',
        scheduleAry:[],
        isToday:false
      }
      daysAry.push(dayObj);
    }
    for(let i=0;i<6;i++){
      let weekAry = [];
      for(let j=0;j<7;j++){
        weekAry.push(daysAry[j+i*7]);
      }
      monthAry.push(weekAry)
    }
    this.setData({
      showDateAry:monthAry,
      showScheduleDetail:false
    })
    this.injectScheduleToAry();
  },

  getDaysInMonth:function(month,year){
    const days = [31,28,31,30,31,30,31,31,30,31,30,31];
    if(year%4==0 && (year%100!=0||year%400==0)){
      days[1] = 29;
    }
    return days[month];
  },

  //日期栏点击右箭头事件
  dateMoveForward:function(){
    let year = this.data.year;
    let month = this.data.month;
    if(month==11){
      month = 0;
      year++;
    }else{
      month++;
    }
    this.setData({
      month:month,
      year:year
    })
    this.makeDaysAry(month,year);
  },

  //日期栏点击左箭头事件
  dateMoveBack:function(){
    let year = this.data.year;
    let month = this.data.month;
    if(month==0){
      month = 11;
      year--;
    }else{
      month--;
    }
    this.setData({
      month:month,
      year:year
    })
    this.makeDaysAry(month,year);
  },

  //点击出日期选择器
  showDatePicker:function(){
    const enable = this.data.showDatePicker;
    this.setData({
      showDatePicker:!enable
    })
  },

  //ajax请求云端日程数据
  getSchedule:function(){
    wx.showLoading({
      title: '加载中',
    })
    wx.cloud.callFunction({
      name:'fund',
      data: {
        action: 'fundSchedule',
        fund:app.globalData.fundUserInfo.fund
      },
      complete:res=>{
        wx.hideLoading();
        if(res.result.list.length>0){
          this.data.scheduleAry = res.result.list;
        }else{
          this.data.scheduleAry = [];
          console.log('没有日程数据');
        }
        this.injectScheduleToAry();
      }
    })
  },

  //注入日程数组到日期数组
  injectScheduleToAry:function(){
    //重置二维数组所有的日程信息队列
    let showDateAry = this.clearScheduleAry(this.data.showDateAry);
    const year = this.data.year;
    const month = this.data.month;
    //新建当月日程信息空数组
    const scheduleAry = [];
    for(let i=0;i<this.data.scheduleAry.length;i++){
      const scheduleDate = new Date(this.data.scheduleAry[i].date);
      if(scheduleDate.getFullYear()==year&&scheduleDate.getMonth()==month){
        if(this.data.topOptionSelected==1||(this.data.topOptionSelected==0&&this.data.userId==this.data.scheduleAry[i].createrId)){
          scheduleAry.push(this.data.scheduleAry[i]);
        }
      }
    }
    //如果所选月份存在日程信息则注入到拷贝的渲染二维数组
    if(scheduleAry.length>0){
      for(let i=0;i<scheduleAry.length;i++){
        let Injected = false;
        const scheduleDay = new Date(scheduleAry[i].date).getDate();
        const XY = this.getIndexViaDay(scheduleDay);
        const x = XY[0];
        const y = XY[1];
        for(let j=0;j<showDateAry[x][y].scheduleAry.length;j++){
          if(showDateAry[x][y].scheduleAry[j]._id==scheduleAry[i]._id){
            showDateAry[x][y].scheduleAry[j] = scheduleAry[i];
            Injected = true;
          }
        }
        if(!Injected){
          showDateAry[x][y].scheduleAry.push(scheduleAry[i]);
        }
      }
    }
    //注入完成，替换当前二维数组
    this.setData({
      showDateAry:showDateAry
    })
  },

  //重置二维数组上所有日程数组为空数组
  clearScheduleAry:function(dateAry){
    for(let i=0;i<dateAry.length;i++){
      for(let j=0;j<dateAry[i].length;j++){
          dateAry[i][j].scheduleAry = [];
      }
    }
    return dateAry;
  },

  //通过日期找出所在二维数组位置
  getIndexViaDay:function(day){
    for(let i=0;i<this.data.showDateAry.length;i++){
      for(let j=0;j<this.data.showDateAry[i].length;j++){
        while(day == this.data.showDateAry[i][j].day){
          return [i,j];
        }
      }
    }
  },

  //点击今天按钮跳转到当前所在月份
  getToday:function(){
    const year = new Date().getFullYear();
    const month = new Date().getMonth();
    this.setData({
      year:year,
      month:month
    });
    this.makeDaysAry(month,year);
  },

  //点击具体日期事件
  getSelected:function(e){
    const XY = this.getShowDataAryIndex(e.target.id);
    const X = XY[0];
    const Y = XY[1];
    if(this.data.showDateAry[X][Y].day>0){
      if(this.data.showDateAry[X][Y].scheduleAry.length>0){
        this.setData({
          showScheduleAry:this.data.showDateAry[X][Y].scheduleAry,
          day:this.data.showDateAry[X][Y].day,
          showScheduleDetail:true
        })
      }else{
        this.setData({
          day:this.data.showDateAry[X][Y].day,
          showScheduleDetail:false
        })
      }
      this.setData({
        selectedIndex:e.target.id
      })
    }
  },

  //点击单个日期回传id解析二维数组的X和Y索引
  getShowDataAryIndex:function(id){
    return [Math.floor(id/7),id%7];
  },

  //点击创建按钮打开日程表编辑组件
  createSchedule:function(){
    if(this.data.userFund!='other'){
      this.setData({
        userId:app.globalData.userId,
        editType:1,
        showEditor:true
      })
    }else{
      wx.showToast({
        title: '请先加入基金会',
        icon:'error',
        duration:1500
      })
    }
  },

  //点击日程详情打开日程表编辑组件
  changeSchedule:function(e){
    let scheduleObj = {};
    const sid = e.currentTarget.dataset.sid;
    for(let i=0;i<this.data.showDateAry.length;i++){
      for(let j=0;j<this.data.showDateAry[i].length;j++){
        if(this.data.day == this.data.showDateAry[i][j].day){
          scheduleObj = this.data.showDateAry[i][j].scheduleAry[sid];
        }
      }
    }
    this.setData({
      editType:2,
      canEdit:app.globalData.userId==scheduleObj.createrId,
      scheduleObj:scheduleObj,
      showEditor:true
    })
  },

  //触摸日历区块开始
  touchStart:function(e){
    this.data.touchPointX = e.touches[0].pageX;
  },

  //触摸日历区块结束，根据滑动距离是否足够长来决定月份前进还是后退
  touchEnd:function(e){
    const endPointX = e.changedTouches[0].pageX;
    const touchDistanceX = endPointX - this.data.touchPointX;
    if(touchDistanceX>50){
      this.dateMoveBack();
    }else if(touchDistanceX<-50){
      this.dateMoveForward();
    }
  },

  //接受日期选择组件传递年参数
  getDateFromPicker:function(e){
    this.setData({
      month:e.detail[0]-1,
      year:e.detail[1]
    })
    this.makeDaysAry(this.data.month,this.data.year);
  },

  //接受日期选择组件关闭参数
  getDatePickerCancel:function(e){
    this.setData({
      showDatePicker:e.detail
    })
  },

  //收到来自日程编辑组件编辑完成广播
  getEditFinish:function(e){
    if(e.detail){
      this.getSchedule();
    }
    this.setData({
      showEditor:false
    })
  },

  //收到来自日程编辑组件的关闭命令
  getEditorOff:function(e){
    this.setData({
      showEditor:e.detail
    })
  },
})