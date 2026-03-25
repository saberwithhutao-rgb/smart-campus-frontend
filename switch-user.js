// 检查当前用户信息
console.log('=== 当前用户状态 ===');
console.log('userInfo:', localStorage.getItem('userInfo'));
console.log('userToken:', localStorage.getItem('userToken'));
console.log('userId:', localStorage.getItem('userId'));

// 模拟修改用户ID为2
console.log('\n=== 修改用户ID为2 ===');

// 读取当前用户信息
const currentUserInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
const currentToken = localStorage.getItem('userToken') || '';

// 修改用户ID
currentUserInfo.userId = 2;

// 修改token以匹配新的用户ID
let newToken = currentToken;
if (currentToken.startsWith('jwt-')) {
  const parts = currentToken.split('-');
  if (parts.length >= 2) {
    parts[1] = '2'; // 将用户ID部分改为2
    newToken = parts.join('-');
  }
}

// 保存修改后的信息
localStorage.setItem('userInfo', JSON.stringify(currentUserInfo));
localStorage.setItem('userToken', newToken);
localStorage.setItem('userId', '2'); // 同时更新userId字段

// 显示修改后的信息
console.log('\n=== 修改后用户状态 ===');
console.log('userInfo:', localStorage.getItem('userInfo'));
console.log('userToken:', localStorage.getItem('userToken'));
console.log('userId:', localStorage.getItem('userId'));

console.log('\n✅ 用户ID已成功切换为2');
