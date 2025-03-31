<template>
    <div class="backup-settings">
        <!-- 备份设置 -->
        <div class="setting-item">
            <h3>备份管理</h3>
            <div class="setting-group">
                <label class="setting-label">导入备份</label>
                <div class="path-selector">
                    <input type="file" class="default-btn" accept=".json" @change="handleFileImport" ref="fileInput"></input>
                </div>
            </div>
            <div class="setting-group">
                <label class="setting-label">导出备份文件</label>
                <button class="save-btn" @click="DownloadData">下载</button>
            </div>
        </div>
        <div class="setting-item">
            <h3>云备份</h3>
            <div class="setting-group">
                <label class="setting-label">云备份设置</label>
                <button class="save-btn" @click="alerts">启用</button>
            </div>
        </div>
    </div>
</template>
<script>
export default {
    methods: {
        alerts() {
            alert("启用云备份需要登录账号，账号功能正在加紧开发中，敬请期待…………");
        },
        DownloadData() {
          const n_id=Date.now().toString(16);
          const state_key = "blacknote_data";
          const savedState = localStorage.getItem(state_key);
          const blob = new Blob([savedState], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = state_key+n_id+'.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        },
        async handleFileImport(event) {
          const file = event.target.files[0];
          if (!file) return;
    
          try {
            const json = await this.readFile(file);
            this.validateBackup(json);
            localStorage.setItem("blacknote_data", JSON.stringify(json));
            if (confirm("导入成功！需要立即刷新应用生效吗？")) {
              window.location.reload();
            } else {
              this.$refs.fileInput.value = '';
              alert("数据已保存到本地存储，如需生效请勿点击确定并立即刷新本窗口。");
            }
          } catch (error) {
            alert(`导入失败: ${error.message}`);
            this.$refs.fileInput.value = '';
          }
        },
    
        readFile(file) {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => {
              try {
                resolve(JSON.parse(e.target.result));
              } catch (e) {
                reject(new Error('无效的JSON格式'));
              }
            };
            reader.onerror = () => reject(new Error('文件读取失败'));
            reader.readAsText(file);
          });
        },
    
        validateBackup(data) {
          if (!data || typeof data !== 'object') {
            throw new Error('无效的备份文件');
          }
          const requiredKeys = ['preferences', 'tags', 'notes'];
          requiredKeys.forEach(key => {
            if (!(key in data)) {
              throw new Error(`缺少必要字段: ${key}`);
            }
          });
          if (!Array.isArray(data.tags) || !Array.isArray(data.notes)) {
            throw new Error('数据格式不正确');
          }
        },
    }
}
</script>
   
  <style scoped>
  .backup-settings {
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
   
  .save-btn, .default-btn {
    padding: 10px 25px;
    margin: 0 10px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    appearance: none;
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
  </style>