const Koa = require("koa");
const Router = require("koa-router");
const bodyParser = require("koa-bodyparser");
const cors = require("@koa/cors");
const fs = require("fs");
const path = require("path");
const app = new Koa();
const router = new Router();

// 确保static目录存在
const staticDir = path.join(__dirname, "static");
if (!fs.existsSync(staticDir)) {
  fs.mkdirSync(staticDir, { recursive: true });
}

// 使用中间件
app.use(cors({
  origin: "http://localhost:8080",
}));
app.use(bodyParser());

// 辅助函数：读取用户文件
const readUserData = (user) => {
  try {
    const filePath = path.join(staticDir, `${user}.txt`);
    return fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      return null; // 文件不存在
    }
    throw err; // 其他错误抛出
  }
};

// 写入用户文件
const writeUserData = (user, data) => {
  try {
    const filePath = path.join(staticDir, `${user}.txt`);
    fs.writeFileSync(filePath, data, 'utf8');
    return true;
  } catch (err) {
    throw err;
  }
};

// 删除用户文件
const removeUserData = (user) => {
  try {
    const filePath = path.join(staticDir, `${user}.txt`);
    fs.unlinkSync(filePath);
    return true;
  } catch (err) {
    throw err;
  }
};

// 获取指定username的云备份信息
router.post('/data', (ctx) => {
  const { user } = ctx.request.body;

  if (!user) {
    ctx.status = 400;
    ctx.body = {
      code: 400,
      message: "用户名不能为空"
    };
    return;
  }

  try {
    const userData = readUserData(user);

    if (userData === null) {
      ctx.status = 404;
      ctx.body = {
        code: 404,
        message: "未找到用户，请先注册！"
      };
    } else {
      ctx.status = 200;
      ctx.body = {
        data: userData
      };
    }
  } catch (err) {
    ctx.status = 500;
    ctx.body = {
      code: 500,
      message: "服务器错误：" + err.message
    };
  }
});

// 备份
router.post('/backup', (ctx) => {
  const { user, localData } = ctx.request.body;

  if (!user || localData === undefined) {
    ctx.status = 400;
    ctx.body = {
      code: 400,
      message: "用户名和数据不能为空"
    };
    return;
  }

  try {
    // 先检查用户是否存在
    const existingData = readUserData(user);

    if (existingData === null) {
      ctx.status = 404;
      ctx.body = {
        code: 404,
        message: "未找到用户，请先注册！"
      };
      return;
    }

    // 写入备份数据
    writeUserData(user, localData);

    ctx.status = 200;
    ctx.body = {
      message: "备份成功！"
    };
  } catch (err) {
    ctx.status = 500;
    ctx.body = {
      code: 500,
      message: "备份失败：" + err.message
    };
  }
});

// 处理注销
router.post('/delete', (ctx) => {
  const { user } = ctx.request.body;

  if (!user) {
    ctx.status = 400;
    ctx.body = {
      code: 400,
      message: "用户名不能为空"
    };
    return;
  }

  try {
    // 先检查用户是否存在
    const existingData = readUserData(user);

    if (existingData === null) {
      ctx.status = 404;
      ctx.body = {
        code: 404,
        message: "未找到用户，请先注册！"
      };
      return;
    }

    // 删除备份数据文件
    removeUserData(user);

    ctx.status = 200;
    ctx.body = {
      message: "注销成功！"
    };
  } catch (err) {
    ctx.status = 500;
    ctx.body = {
      code: 500,
      message: "注销失败：" + err.message
    };
  }
});

// 处理注册
router.post('/register', (ctx) => {
  const { user, localData } = ctx.request.body;

  if (!user || localData === undefined) {
    ctx.status = 400;
    ctx.body = {
      code: 400,
      message: "用户名和数据不能为空"
    };
    return;
  }

  try {
    // 检查用户是否已存在
    const existingData = readUserData(user);

    if (existingData !== null) {
      ctx.status = 400;
      ctx.body = {
        code: 400,
        message: "用户名已被注册，请登录！"
      };
      return;
    }

    // 创建新用户文件
    writeUserData(user, localData);

    ctx.status = 200;
    ctx.body = {
      message: "注册成功！"
    };
  } catch (err) {
    ctx.status = 500;
    ctx.body = {
      code: 500,
      message: "注册失败：" + err.message
    };
  }
});

app
  .use(router.routes())
  .use(router.allowedMethods());

app.listen(3456, () => {
  console.log("后端服务器启动成功！");
});
