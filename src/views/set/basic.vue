<template>
    <div class="basic-settings">
      <!-- 外观设置 -->
      <div class="setting-item">
        <h3>外观设置</h3>
        <div class="setting-group">
          <div class="checkbox-item">
            <label for="dark" class="setting-label">深色模式：</label>
            <input type="checkbox" id="dark" v-model="$store.state.preferences.dark" @click="changeDark" @change="$store.commit('saveState')" class="checkbox">
          </div>
        </div>
   
        <div class="setting-group">
          <label class="setting-label">主题颜色：</label>
          <input type="color" style="margin-left: 10px;" v-model="$store.state.preferences.item_color" @change="$store.commit('saveState')">
        </div>
   
        <div class="setting-group">
          <label class="setting-label">设置背景图片：</label>
          <div class="path-selector">
            <input type="number" min="0" max="6" step="1" v-model="$store.state.preferences.background_img" id="background_img" class="default-btn"><!--实测要按钮事件才触发-->
            <button class="default-btn" @click="changePath">设定背景</button>
            <button class="remove-btn" @click="removePath">清空背景</button>
          </div>
        </div>
      </div>
   
      <!-- 默认视图设置 -->
      <div class="setting-item">
        <h3>默认视图</h3>
        <div class="setting-group">
          <label class="setting-label">启动时显示：</label>
          <select v-model="$store.state.preferences.homepage" class="custom-select" @change="$store.commit('saveState')">
            <option value="MainView">主页面</option>
            <option value="pending">待完成</option>
            <option value="completed">已完成</option>
          </select>
        </div>
   
        <div class="setting-group">
          <label class="setting-label">默认视图：</label>
          <select v-model="$store.state.preferences.default_view" class="custom-select" @change="updateDefaultView($event.target.value)">
            <option value="1">列表视图</option>
            <option value="2">卡片视图</option>
          </select>
        </div>
      </div>
    </div>
  </template>
   
<script>
export default {
  data() {
    return {}
  },
  methods: {
    changePath() {
        var img_num = document.getElementById("background_img").value;
        if(img_num==0||img_num==6){
          if(this.$store.state.preferences.dark){
            this.$store.state.preferences.background_img=6;
          }else{
            this.$store.state.preferences.background_img=0;
          }
        }
        if(img_num==1){
            this.$store.state.preferences.background_img=1;
        }
        if(img_num==2){
            this.$store.state.preferences.background_img=2;
        }
        if(img_num==3){
            this.$store.state.preferences.background_img=3;
        }
        if(img_num==4){
            this.$store.state.preferences.background_img=4;
        }
        if(img_num==5){
            this.$store.state.preferences.background_img=5;
        }
        this.$store.commit('saveState')
    },
    changeDark() {
        var img_num = document.getElementById("background_img").value;
        if(img_num==0||img_num==6){
          if(this.$store.state.preferences.dark){
            this.$store.state.preferences.background_img=0;
          }else{
            this.$store.state.preferences.background_img=6;
          }
        }
    },
    removePath() {
      if(this.$store.state.preferences.dark){
        this.$store.state.preferences.background_img=6;
      }else{
         this.$store.state.preferences.background_img=0;
      }
      this.$store.commit('saveState')
    },
    updateDefaultView(value) {
      this.$store.state.preferences.default_view=Number(value);
      this.$store.commit('saveState');
    }
  }
}
</script>
   
  <style scoped>
  .basic-settings {
    padding: 20px;
  }
   
  .setting-item {
    margin-bottom: 30px;
    padding: 15px;
    background: rgba(255, 255, 255, 0.6);
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
   
  .setting-item h3 {
    color: #333;
    margin-bottom: 15px;
    padding-bottom: 8px;
    border-bottom: 1px solid #eee;
  }
   
  .setting-group {
    display: flex;
    align-items: center;
    margin: 12px 0;
  }
   
  .setting-label {
    width: 120px;
    color: #666;
    font-size: 14px;
    height: 20px;
  }
   
  .custom-select {
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    width: 200px;
  }
   
  .custom-input {
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    width: 180px;
    margin-right: 10px;
  }
   
  .unit {
    color: #999;
    font-size: 14px;
  }
   
  .path-selector {
    display: flex;
    align-items: center;
  }
   
  .path-input {
    flex: 1;
    margin-right: 10px;
  }
   
  .action-buttons {
    margin-top: 25px;
    text-align: center;
  }
   
  .save-btn, .default-btn {
    padding: 10px 25px;
    margin: 0 10px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s;
  }
   
  .save-btn {
    background: #5fc153;
    color: white;
  }
   
  .save-btn:hover {
    background: #4fa044;
  }
   
  .default-btn {
    background: #f0f0f0;
    color: #666;
  }
   
  .default-btn:hover {
    background: #e0e0e0;
  }
   
  .radio-group {
    display: flex;
    gap: 20px;
  }
   
  .radio-label {
    margin-left: 5px;
    color: #666;
  }
  .checkbox-item {
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .checkbox {
    width: 40px;
    height: 20px;
    appearance: none;
    background-color: #bfbfbf;
    border-radius: 20px;
    position: relative;
    transition: all 0.4s;
  }
  .checkbox::before {
      position: absolute;
      content: "";
      height: 16px;
      width: 16px;
      left: 2px;
      bottom: 2px;
      background-color: white;
      transition: .4s;
      border-radius: 50%;
  }
  .checkbox:checked::before {
    transform: translateX(20px);
  }
  .checkbox:checked {
    background-color: #111;
  }
  .remove-btn {
    padding: 10px 25px;
    margin: 0 10px;
    border: none;
    border-radius: 6px;
    transition: all 0.3s;
    background-color: #ed695f;
    color: white;
  }
   
  .remove-btn:hover {
    background: #de493b;
  }
  </style>