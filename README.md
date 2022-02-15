# Nextjs and Qiankun 管理平台

## 启动

### Install VSCode plugins

- [ESlint extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [Prettier extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
- [TypeScript Import sorter](https://marketplace.visualstudio.com/items?itemName=mike-co.import-sorter)
  快捷键`command + shift + o`

### Install packages

```bash
yarn
```

### Scripts

```bash
yarn dev # start project and develop

yarn build # build project with production

yarn start # run the build files

yarn lint  # lint
```

## 如何进行开发

1. 配置本地 apiServer
2. 尽量遵守以下开发守则
3. 代码互相 Review

### apiServer

新增文件`.env.development.local`
文件新增内容，如：

```yaml
apiServer=http://139.198.31.162:30880
```

### Rules

- Always use **interface** for **public API’s definition** when authoring a library or 3rd-party ambient type definitions.
- Always use **type** for your React Component **Props and State**, because it is more constrained.
- Always add descriptive comments to your props using the TSDoc notation /\*_ comment _/.
- When props are optional, use **default values**.
- If add third parties must be with **@types** packages which is the TypeScript type definitions.
- Always commit by **Git commands**, as this tirggers husky hooks.

### For Example

- Function Component

```ts
import React from 'react';

// Written as a function declaration
function Heading(): React.ReactElement {
  return <h1>My Website Heading</h1>;
}

// Written as a function expression. React.FC is discouraged.
const OtherHeading = (props: Props) => <h1>My Website Heading</h1>;
```

- useState

```ts
type User = {
  email: string;
  id: string;
};

// together generic and union, TypeScript knows, "Ah, user can be User or null".
const [user, setUser] = useState<User | null>(null);
```

- onchange

```ts
import React from 'react';

const MyInput = () => {
  const [value, setValue] = React.useState('');

  // The event type is a "ChangeEvent"
  // We pass in "HTMLInputElement" to the input
  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValue(e.target.value);
  }

  return <input value={value} onChange={onChange} id="input-example" />;
};
```

- type extends by &

```ts
type ButtonProps = {
  /** the background color of the button */
  color: string;
  /** the text to show inside the button */
  text: string;
};

type ContainerProps = ButtonProps & {
  /** the height of the container (value used with 'px') */
  height: number;
};
```

- fetch data

```ts
import type { NextPage } from 'next';
import { EHttpMethods } from '../api/fetcher';
import useFetchData from '../components/common/hooks/useFetchData';

const Home: NextPage = () => {
  // default http method is GET
  const { data, loading, error } = useFetchData('/api/user');
  // create user
  const { data, loading, error } = useFetchData('/api/user', {
    method: EHttpMethods.POST,
    params: { name: 'newUser' },
  });

  return (
    <div>
      <div>loading: {loading?.toString()}</div>
      <div>data: {JSON.stringify(data)}</div>
      <div>error: {error?.toString()}</div>
    </div>
  );
};

export default Home;
```

### 通用样式 class

- flex 布局，class：`f-r`、`f-c`等等，具体查看`/styles/flex.scss`

- 鼠标指针，class：`cur-p`、`cur-h`等等，具体查看`/styles/cursor.scss`

- font-size，class：`fs-x`，x 取 12-36，间隔为 2，

- font-weight，class：`fw-x`，x 取 400-800，间隔为 100

如下示例：
| Class | Properties |
| ---- | ---- |
| f-r | display:flex; flex-direction: row |
| cur-p | cursor:pointer |
| fs-12 | font-size:12px |
| fw-500 | font-weight:500 |

## 接入微应用

微服务使用 qiankun 库来实现，具体可以参考[qiankun](https://qiankun.umijs.org/)和[官方示例](https://github.com/umijs/qiankun/tree/master/examples)。

### 1. 在容器注册微应用

- `src/micro/registerMicroAppsConfig.ts`文件中新增代码

```js
  {
    name: 'bigdata',
    entry: 'http://139.198.174.152:3001',
    container: '#mainView',
    activeRule: '/bigdata',
    loader,
  },
```

- pages 下新增路由 bigdata.tsx

```ts
/**
 * For Micro Application
 * @returns null
 */
export default function BigData() {
  return null;
}
```

### 2. 在微应用项目中增加生命周期钩子和 webpack 打包配置

- 在 webpack 的 entry 入口文件中增加生命周期钩子

```js
/**
 * webpack环境变量设置
 */
if (window.__POWERED_BY_QIANKUN__) {
  // eslint-disable-next-line no-undef
  __webpack_public_path__ = window.__INJECTED_PUBLIC_PATH_BY_QIANKUN__;
}
/**
 * bootstrap 只会在微应用初始化的时候调用一次，下次微应用重新进入时会直接调用 mount 钩子，不会再重复触发 bootstrap。
 * 通常我们可以在这里做一些全局变量的初始化，比如不会在 unmount 阶段被销毁的应用级别的缓存等。
 */
export async function bootstrap() {
  console.log('react app bootstraped');
}

/**
 * 应用每次进入都会调用 mount 方法，通常我们在这里触发应用的渲染方法
 */
export async function mount(props) {
  ReactDOM.render(<App />, props.container ? props.container.querySelector('#root') : document.getElementById('root'));
}

/**
 * 应用每次 切出/卸载 会调用的方法，通常在这里我们会卸载微应用的应用实例
 */
export async function unmount(props) {
  ReactDOM.unmountComponentAtNode(
    props.container ? props.container.querySelector('#root') : document.getElementById('root')
  );
}

/**
 * 可选生命周期钩子，仅使用 loadMicroApp 方式加载微应用时生效
 */
export async function update(props) {
  console.log('update props', props);
}
```

- 为了让主应用能正确识别微应用暴露出来的一些信息，微应用的 webpack 需要增加如下配置

```js
const packageName = require('./package.json').name;

module.exports = {
  output: {
    library: `${packageName}-[name]`,
    libraryTarget: 'umd',
    jsonpFunction: `webpackJsonp_${packageName}`,
  },
};
```

更多文档，查看[qiankun](https://qiankun.umijs.org/zh/guide/tutorial)

## Learn More

[Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.

To learn React, check out the [React documentation](https://reactjs.org/).

Http request hooks [SWR](https://swr.vercel.app/docs/getting-started).

[React with Typescript best practices](https://www.sitepoint.com/react-with-typescript-best-practices/)

[React Typescript cheatsheets](https://github.com/typescript-cheatsheets/react)
