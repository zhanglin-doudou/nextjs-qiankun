import { AppMetadata } from 'qiankun';
import { useEffect } from 'react';

import { Microconfig } from '../../../micro/registerMicroAppsConfig';

interface Props {
  children?: JSX.Element | JSX.Element[];
}

export default function Main(props: Props) {
  const register = async () => {
    const qiankun = await import('qiankun');
    // 注册微应用
    qiankun.registerMicroApps(Microconfig, {
      // qiankun 生命周期钩子 - 微应用加载前
      beforeLoad: (app: AppMetadata) => {
        console.log('before load', app, app.name);
        return Promise.resolve();
      },
      // qiankun 生命周期钩子 - 微应用挂载后
      afterMount: (app: AppMetadata) => {
        console.log('after mount', app.name);
        return Promise.resolve();
      },
    });

    // 启动 qiankun
    qiankun.start();

    // 添加全局异常捕获
    qiankun.addGlobalUncaughtErrorHandler((handler) => {
      console.log('异常捕获', handler);
    });
  };
  useEffect(() => {
    register();
  }, []);

  return <main id="mainView">{props.children}</main>;
}
