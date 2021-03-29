// component/scheduleeditor/scheduleeditor.js
Component({
  // 组件的属性列表
  properties: {
    editType:{
      type:Number
    },
    canEdit:{
      type:Boolean,
      value:false
    },
    year:{
      type:Number
    },
    month:{
      type:Number
    },
    day:{
      type:Number
    },
    userId:{
      type:String
    },
    userName:{
      type:String
    },
    userAvatar:{
      type:String
    },
    userFund:{
      type:String
    },
    scheduleObj:{
      type:Object
    },
  },

  //生命周期函数
  lifetimes: {
    attached: function() {
      const selecteddate = this.getPickerFormat(this.data.year,this.data.month,this.data.day);
      this.setData({
        selectedDate:selecteddate,
        originDate:selecteddate,
        renewDateToStr:this.dateFormat(this.data.scheduleObj.renew_date),
        scheduleEditorStyle:'transform:translateY(0);',
      })
      if(this.data.editType==2){
        this.setData({
          userName:this.data.scheduleObj.name,
          userAvatar:this.data.scheduleObj.avatarUrl,
          scheduleDetail:this.data.scheduleObj.detail,
          showRenewDate:true,
        })
      }else if(this.data.editType==1){
        this.setData({
          showRenewDate:false,
        })
      }
    }
  },

  // 组件的初始数据
  data: {
    scheduleEditorStyle:'',
    selectedDate:'2020-01-01',
    originDate:'2020-01-01',
    scheduleDetail:'',
    editMsg:'',
    renewDateToStr:'',
    showRenewDate:false,
  },

  // 组件的方法列表
  methods: {
    bindDateChange:function(e){
      this.setData({
        selectedDate: e.detail.value,
      })
    },
    bindDetailInput:function(e){
      this.setData({
        scheduleDetail: e.detail.value
      })
    },

    //生成与日期选择value格式相同的原始值
    getPickerFormat:function(year,month,day){
      month++;
      if(month<10){
        month = '0'+month;
      }
      if(day<10){
        day = '0'+day;
      }
      return year + '-' + month + '-' + day;
    },

    //获取时间戳生成字符串包含年月日时分秒
    dateFormat:function(timestamp) {
      const date = new Date(timestamp);
      const month = date.getMonth() + 1 < 10 ? "0" + (date.getMonth() + 1) : date.getMonth() + 1;
      const day = date.getDate() < 10 ? "0" + date.getDate() : date.getDate();
      const hour = date.getHours() < 10 ? "0" + date.getHours() : date.getHours();
      const minutes = date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
      const seconds = date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds();
      return date.getFullYear()+'-'+month+'-'+day+' '+hour+':'+minutes+':'+seconds;
    },

    //创建新日程信息生成确认框
    createNewSchedule(){
      if(this.data.scheduleDetail.length>0){
        wx.showModal({
          title: '请确认',
          content: '确定创建新的日程信息吗？',
          success:res=> {
            if (res.confirm) {
              this.updateNewScheduleInfo();
              console.log('确定');
            } else if (res.cancel) {
              console.log('我再想想')
            }
          }
        })
      }else{
        this.setData({
          editMsg:'日程详情为空，无法创建'
        })
      }
    },

    //更改现有日程信息生成确认框
    editSchedule:function(){
      if(this.data.scheduleDetail.length==0){
        this.setData({
          editMsg:'日程详情为空，无法保存'
        })
      }else if(this.data.scheduleDetail==this.data.scheduleObj.detail&&this.data.originDate==this.data.selectedDate){
        this.setData({
          editMsg:'没有修改任何信息'
        })
      }else{
        wx.showModal({
          title: '请确认',
          content: '确定更新此日程信息吗？',
          success:res=> {
            if (res.confirm) {
              this.updateScheduleInfo();
              console.log('确定');
            } else if (res.cancel) {
              console.log('我再想想')
            }
          }
        })
      }
    },

    //ajax上传新的创建的日程记录到云端
    updateNewScheduleInfo:function(){
      if(this.data.userId){
        wx.showLoading({
          title: '加载中',
        })
        const DB = wx.cloud.database().collection("schedule");
        DB.add({
          data:{
            createrId:this.data.userId,
            date:new Date(this.data.selectedDate),
            detail:this.data.scheduleDetail,
            fund:this.data.userFund,
            renew_date:Date.now()
          },
          success:res=>{
            wx.hideLoading();
            console.log("添加日程成功")
            this.setData({
              editMsg:'添加日程信息成功!'
            })
            this.successCallBack();
          },
          fail:res=>{
            wx.hideLoading();
            console.log("添加日程失败",res)
          }
        })
      }else{
        console.log('获取用户id失败');
      }
      
    },

    //ajax更新日程记录到云端
    updateScheduleInfo:function(){
      wx.showLoading({
        title: '加载中',
      })
      const DB = wx.cloud.database();
      DB.collection("schedule").where({
        _id:this.data.scheduleObj._id,
        fund:this.data.userFund
        }).update({
        data:{
          date:new Date(this.data.selectedDate),
          detail:this.data.scheduleDetail,
          renew_date:Date.now()
        },
        success:res=>{
          wx.hideLoading();
          if(res.stats.updated>0){
            console.log("修改日程信息成功!");
            this.setData({
              editMsg:'修改日程信息成功!'
            })
            this.successCallBack();
          }else{
            console.log("修改失败")
          }
        },
        fail:res=>{
          wx.hideLoading();
          console.log("更新云数据失败!")
          this.setData({
            editMsg:'更新云数据失败!'
          })
        }
      })
    },

    //删除日程信息记录
    deleteSchedule:function(){
      wx.showModal({
        title: '确认删除',
        content: '确定删除此日程信息吗？',
        success:res=> {
          if (res.confirm) {
            this.deleteScheduleFromCloud();
            console.log('确定');
          } else if (res.cancel) {
            console.log('我再想想')
          }
        }
      })
    },

    //ajax删除云端日程信息记录
    deleteScheduleFromCloud:function(){
      wx.showLoading({
        title: '加载中',
      })
      const DB = wx.cloud.database();
      DB.collection("schedule").where({
        _id:this.data.scheduleObj._id,
        fund:this.data.userFund
        }).remove({
        success:res=>{
          wx.hideLoading();
          if(res.stats.removed>0){
            console.log("已成功删除日程信息!");
            this.setData({
              editMsg:'已成功删除日程信息!'
            })
            this.successCallBack();
          }else{
            console.log("删除失败")
          }
        },
        fail:res=>{
          console.log("更新云数据失败!")
          wx.hideLoading();
          this.setData({
            editMsg:'更新云数据失败!'
          })
        }
      })
    },

    successCallBack:function(){
      this.triggerEvent('editFinish',true);
    },

    cancel:function(){
      this.triggerEvent('closeEditor',false);
    },
  }
})
