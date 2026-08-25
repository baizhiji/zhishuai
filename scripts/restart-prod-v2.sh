#!/bin/bash
# 重启生产服务并验证
cd /var/www/zhishuai/server || exit 1

echo "=== 重启 pm2 ==="
pm2 restart zhishuai-api --update-env
sleep 4

echo "=== 进程状态 ==="
pm2 jlist 2>/dev/null | node -e '
let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{
  const a=JSON.parse(d);
  const p=a.find(x=>x.name==="zhishuai-api");
  if(!p){console.log("未找到进程");return}
  console.log("status:", p.pm2_env.status);
  console.log("restart_time:", p.pm2_env.restart_time);
  console.log("unstable_restarts:", p.pm2_env.unstable_restarts);
})'

echo "=== 健康检查 ==="
curl -s http://localhost:3001/health
echo ""

echo "=== 最近日志 ==="
pm2 logs zhishuai-api --lines 15 --nostream 2>&1 | tail -15
