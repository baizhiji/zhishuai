#!/bin/bash
# 交叉验证收尾：验证修复后 URL 可访问 + 精确清理测试产生的素材
API=http://127.0.0.1:3001
echo "--- new url access ---"
curl -s -o /dev/null -w "fixed_url=%{http_code}\n" --max-time 5 https://api.baizhiji.net/uploads/materials/1787633879584-fph9h22z9gi.png

TOKEN=$(curl -s -X POST $API/api/auth/login -H 'Content-Type: application/json' \
  -d '{"loginType":"admin","phone":"18601655222","password":"20061218"}' \
  | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{try{console.log(JSON.parse(s).data.token||'')}catch(e){console.log('')}})")
[ -z "$TOKEN" ] && { echo "LOGIN FAILED"; exit 1; }

echo "--- uploads material records (before cleanup) ---"
curl -s "$API/api/materials?pageSize=50" -H "Authorization: Bearer $TOKEN" \
  | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{const l=JSON.parse(d).data.list||[];l.filter(m=>m.content&&m.content.includes('/uploads/')).forEach(m=>console.log(m.id,'|',m.title,'|',m.content))}catch(e){console.log('ERR',e.message)}})"

# 精确删除本次交叉验证产生的测试记录
for MID in mat_1787633549633_qn8hwm mat_1787633551090-z6jb6p8b06.txt mat_1787633551116_6gqg5s mat_1787633759250_l68jj7 mat_1787633879586_yadnr5; do
  echo -n "delete $MID -> "
  curl -s -X DELETE "$API/api/materials/$MID" -H "Authorization: Bearer $TOKEN"
  echo ""
done

# 删除测试上传的文件
sudo rm -f /var/www/zhishuai/server/uploads/materials/1787633759248-0wm28pvb7nf.png \
  /var/www/zhishuai/server/uploads/materials/1787633879584-fph9h22z9gi.png
echo "--- uploads dir after cleanup ---"
ls -la /var/www/zhishuai/server/uploads/materials/
