<template>
  <div class="advance-settings">
    <!-- 高级设置 -->
    <div class="setting-item">
        <h3>高级设置</h3>
        <div class="setting-group">
          <div class="checkbox-item">
            <label for= "remove_warning" class="setting-label">删除笔记前弹窗警告</label><br/>
            <input type="checkbox" id="remove_warning" v-model="$store.state.preferences.remove_warning" class="checkbox" @change="$store.commit('saveState')"><br/>
            <label for= "remove_force" class="setting-label">强制删除笔记（不放入回收站）</label><br/>
            <input type="checkbox" id="remove_force" v-model="$store.state.preferences.remove_force" class="checkbox" @change="$store.commit('saveState')"><br/>
            <label for= "enable_markdown" class="setting-label">在任务预览中启用MarkDown</label><br/>
            <input type="checkbox" id="enable_markdown" v-model="$store.state.preferences.enable_markdown" class="checkbox" @change="$store.commit('saveState')"><br/>
          </div>
        </div>
        <h3>数据管理</h3>
        <div class="setting-group">
          <label class="setting-label">删除本地数据</label>
          <button class="remove-btn" @click="alerts">删除</button>
        </div>
    </div>
  </div>
</template>
<script>
export default {
  methods: {
    alerts() {
      if(confirm("你确定要删除本地所有数据吗？内存数据及已导出的备份不会被删除。")){
        const state_key = "blacknote_data";
        localStorage.removeItem(state_key);
        if (confirm("删除成功！需要立即清空内存吗？")) {
          window.location.reload();
        }
        else {
          alert("已删除本地数据，如需清空内存数据请勿点击确定并立即刷新本窗口。");
        }
      }
    }
  }
}
</script>
   
  <style scoped>
  .advance-settings {
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
   
  .radio-group {
    display: flex;
    gap: 20px;
  }
   
  .radio-label {
    margin-left: 5px;
    color: #666;
  }

  .checkbox {
    width: 40px;
    height: 20px;
    appearance: none;
    background-color: #bfbfbf;
    margin-top: 5px;
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
    background-color: #2196F3;
  }
  .remove-btn {
      padding: 10px 25px;
      margin: 0 10px;
      border: none;
      border-radius: 6px;
      transition: all 0.3s;
    }
    .remove-btn {
      background-color: #ed695f;
      color: white;
    }
    
    .remove-btn:hover {
      background: #de493b;
    }
  </style>