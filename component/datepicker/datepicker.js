// component/datepicker/datepicker.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    yearFromSchedule:{
      type:Number
    },
    monthFromSchedule:{
      type:Number
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    years:[],
    year: new Date().getFullYear(),
    months:[],
    month: new Date().getMonth()+1,
    days:[],
    value: [new Date().getFullYear(), new Date().getMonth()+1],
  },

  //生命周期函数
  lifetimes: {
    attached: function() {
      const date = new Date();
      const years = [];
      const months = [];
      this.setData({
        year:this.data.yearFromSchedule,
        month:this.data.monthFromSchedule+1
      })
      for (let i = date.getFullYear()-1; i <= date.getFullYear()+10; i++) {
        years.push(i)
      }
      this.setData({
        years:years
      })
      for (let i = 1; i <= 12; i++) {
        months.push(i)
      }
      this.setData({
        months:months
      })
    }
  },
  /**
   * 组件的方法列表
   */
  methods: {
    bindChange(e) {
      const val = e.detail.value
      this.setData({
        year: this.data.years[val[0]],
        month: this.data.months[val[1]],
      })
    },

    //选择好日期好点击确定回传参数
    confirm:function(){
      this.triggerEvent('dateFromPicker',[this.data.month,this.data.year]);
      this.triggerEvent('closeDatePicker',false);
    },

    //关闭日期选择组件
    cancel:function(){
      this.triggerEvent('closeDatePicker',false);
    }
  }

})
