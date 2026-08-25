#!/bin/bash
# 清理测试上传产生的素材记录与文件
API=http://127.0.0.1:3001

TOKEN=$(curl -s -X POST $API/api/auth/login -H 'Content-Type: application/json' \
  -d '{"phone":"18601655222","password":"20061218","loginType":"admin"}' | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{console.log(JSON.parse(d).data.token||'')}catch(e){console.log('')}})")

if [ -z "$TOKEN" ]; then echo "登录失败"; exit 1; fi

# 删除测试产生的素材记录（标题为 valid.png/hello.txt/fake.jxl 等测试文件）
curl -s -X GET "$API/api/materials?pageSize=50" -H "Authorization: Bearer $TOKEN" | node -e "
let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{
  try {
    const list=JSON.parse(d).data.list||[];
    list.filter(m=>m.content&&m.content.includes('/uploads/materials/')).forEach(m=>{
      console.log(m.id);
    });
  } catch(e){ console.error('parse err', e.message); }
});" > /tmp/test_mat_ids.txt

while read -r MID; do
  [ -z "$MID" ] && continue
  echo -n "删除 $MID ... "
  curl -s -X DELETE "$API/api/materials/$MID" -H "Authorization: Bearer $TOKEN"
  echo ""
done < /tmp/test_mat_ids.txt