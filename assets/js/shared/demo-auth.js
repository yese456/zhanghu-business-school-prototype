/* 本地演示账号，仅用于原型登录与改密交互；不连接真实账号系统。 */
(function(){
  'use strict';
  const S=window.SHARED, KEY='demo:account';
  const digest=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(n=>n.toString(16).padStart(2,'0')).join('');
  S.demoAuth={
    account:'13800000000',
    async verify(account,password){const saved=S.store.get(KEY);return account===this.account&&await digest(password)===(saved?.hash||await digest('demo12345'));},
    async change(old,next){if(!await this.verify(this.account,old))throw new Error('原演示密码不正确');if(next.length<8)throw new Error('新密码至少 8 位');if(next===old)throw new Error('新密码不能与原密码相同');S.store.set(KEY,{account:this.account,hash:await digest(next),updated:S.now()});}
  };
})();
