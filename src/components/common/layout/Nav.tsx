export default function nav() {
  return (
    <nav>
      <h1>导航栏</h1>
      <ul>
        <li>
          {
            // TODO：微应用之间的跳转需要用SSR，可优化
            // eslint-disable-next-line @next/next/no-html-link-for-pages
            <a href="/">首页</a>
          }
        </li>
        <li>
          {
            // eslint-disable-next-line @next/next/no-html-link-for-pages
            <a href="/dashboard">Dashboard</a>
          }
        </li>
        <li>
          {
            // eslint-disable-next-line @next/next/no-html-link-for-pages
            <a href="/bigdata">Big data</a>
          }
        </li>
      </ul>
    </nav>
  );
}
