<template>
  <div class="empty">
    <!-- 空页面 -->
    <h1>欢迎使用小黑记事本</h1>
    <h3>👈点击左侧任一标签开始使用</h3>
    <p>如因页面报错、数据损坏等原因导致无法进入偏好设置——高级——删除本地数据，请转到浏览器设置——网站数据管理——清除本网站的数据</p>
    或&nbsp;<a href="#" @click.prevent="alerts" class="btn">强制删除本地数据</a><br/><br/>
    <a href="https://github.com/bilibiliales/vueblacknote" style="color: #666; text-decoration: none;" target="_blank">版本号：1.0.11->></a><br/>
    <a href="https://gitee.com/bilibiliales/vueblacknote" style="color: #666; text-decoration: none;" target="_blank">备用仓库地址->></a>
  </div>
</template>

<script>
  export default {
    name: 'root',
    data() {
      return {}
    },
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
    },
  }
</script>
<style scoped>
  .btn {
    display: inline-flex;
    background-color: #057ada;
    color: white;
    padding: 10px 20px;
    text-align: center;
    text-decoration: none;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.3s;
  }
  .btn:active {
    background-color: #0e67c1;
  }
</style>
