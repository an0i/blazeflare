<script>
  import { SvgFile, SvgFire, SvgFolder, SvgLogin, SvgLogout, SvgSetting } from "./components/icons";
  import { HashRoute, formatBytes } from "./utils";
  if (location.hash === "") location.hash = "#list#";
  const routeNow = new HashRoute(decodeURIComponent(location.hash));

  const logined = document.cookie.includes("id_token");
  const nickname = logined ? JSON.parse(localStorage.getItem("user_info")).nickname : "everyone";
</script>

<svelte:window
  on:hashchange={(e) => {
    if (new URL(e.newURL).hash === "") location.hash = "#list#";
    routeNow.hash = decodeURIComponent(new URL(e.newURL).hash);
  }}
/>

<div id="app-root" class="flex h-full flex-col">
  <div class="box-border flex overflow-x-auto border-b">
    <h1 id="title" class="p-1.5">
      <a href={import.meta.env.BASE_URL} class="block size-11 rounded-full fill-red-600 font-semibold hover:bg-gray-100 active:hover:bg-gray-200"><SvgFire class="size-full" /></a>
      <a href={import.meta.env.BASE_URL} class="ifnocss">BlazeFlare</a>
    </h1>

    <ul id="navigator" class="ml-auto box-border flex gap-1.5 border-l p-1.5">
      <li>
        <a href="{import.meta.env.BASE_URL}#list#" class="block size-11 rounded-full p-1.5 {routeNow.getAction() === '#list#' ? 'border border-yellow-500 fill-yellow-500' : 'fill-gray-300'} hover:bg-gray-100 active:hover:bg-gray-200"><SvgFolder class="size-full" /></a>
        <a href="{import.meta.env.BASE_URL}#list#" class="ifnocss">文件</a>
      </li>
      <li>
        <a href="{import.meta.env.BASE_URL}#setting#" class="block size-11 rounded-full p-1.5 {routeNow.getAction() === '#setting#' ? 'border border-blue-500 fill-blue-500' : 'fill-gray-300'} hover:bg-gray-100 active:hover:bg-gray-200"><SvgSetting class="size-full" /></a>
        <a href="{import.meta.env.BASE_URL}#setting#" class="ifnocss">设置</a>
      </li>
    </ul>

    <div>
      {#if logined}
        <a href="{import.meta.env.BASE_URL}user/logout.html" class="box-border block size-14 border-l fill-gray-300 p-3 hover:bg-gray-100 active:hover:bg-gray-200"><SvgLogout class="size-full" /></a>
        <a href="{import.meta.env.BASE_URL}user/logout.html" class="ifnocss">登出</a>
      {:else}
        <a href="{import.meta.env.BASE_URL}user/login.html" class="box-border block size-14 border-l fill-gray-300 p-3 hover:bg-gray-100 active:hover:bg-gray-200"><SvgLogin class="size-full" /></a>
        <a href="{import.meta.env.BASE_URL}user/login.html" class="ifnocss">登录</a>
      {/if}
    </div>
  </div>

  <div id="action" class="flex grow flex-col">
    {#if routeNow.getAction() === "#list#"}
      <div id="list" class="flex grow flex-col">
        <p class="ifnocss">位置</p>
        <ul id="list-breadcrumb" class="box-border flex flex-wrap items-center gap-1 border-b p-2 text-gray-500">
          <li>
            {#if routeNow.getPrefixInfixSuffix() !== ""}
              <a href="{import.meta.env.BASE_URL}{routeNow.getAction()}" class="block rounded-full bg-gray-50 px-2 py-1 hover:bg-gray-100 active:hover:bg-gray-200">根目录</a>
            {:else}
              <span class="block rounded-full px-2 py-1 text-black">根目录</span>
            {/if}
          </li>
          {#each routeNow.getSegments() as segment, i}
            <span class="before:content-['/']"></span>
            {#if i !== routeNow.getSegments().length - 1}
              <li class="max-w-full">
                <a
                  href="{import.meta.env.BASE_URL}{routeNow.getAction()}{routeNow
                    .getSegments()
                    .slice(0, i + 1)
                    .join('/') + '/'}"
                  class="block truncate rounded-full bg-gray-50 px-2 py-1 hover:bg-gray-100 active:hover:bg-gray-200">{segment}</a
                >
              </li>
            {:else}
              <li class="block max-w-full truncate rounded-full px-2 py-1 text-black">{segment}</li>
            {/if}
          {/each}
        </ul>
        {#await fetch(`/api/getTree/${nickname}`).then((res) => res.json())}
          <div id="list-loading" class="grow">
            <p class="p-2">正在加载文件树...</p>
          </div>
        {:then root}
          {#await new Promise((resolve, reject) => {
            let current = root;
            const segments = routeNow.getSegments();
            for (let i = 0; i < segments.length; ++i) {
              const segment = segments[i];
              let findResult = current.nodes.find((node) => (i !== segments.length - 1 ? node.isFolder : node.isFolder === routeNow.isFolder()) && node.name === segment);
              if (findResult === undefined) return reject(new Error("文件树中找不到该文件(夹)"));
              current = findResult;
            }
            return resolve(current);
          }) then currentNode}
            <p class="ifnocss">文件</p>
            {#if routeNow.isFolder()}
              <ul id="list-folderview" class="h-0 grow overflow-y-auto overscroll-y-none">
                {#each currentNode.nodes as node}
                  <li>
                    <a class="box-border flex gap-2 border-b p-2 hover:bg-gray-100 active:hover:bg-gray-200" href="{import.meta.env.BASE_URL}{routeNow.hash}{node.name}{node.isFolder ? '/' : ''}">
                      {#if node.isFolder}
                        <SvgFolder class="size-11 fill-blue-300" />
                      {:else}
                        <SvgFile class="size-11 fill-blue-300" />
                      {/if}
                      <span class="flex h-full w-0 grow flex-col">
                        <span class="truncate">{node.name}</span>
                        <span class="truncate text-sm text-gray-500">
                          {#if !node.isFolder}
                            <span>{formatBytes(node.size)}</span>
                            <span>{new Date(1703503284214).toLocaleString()}</span>
                          {:else}
                            <span>文件夹</span>
                          {/if}
                        </span>
                      </span>
                    </a>
                  </li>
                {/each}
              </ul>
            {:else}
              <div id="list-fileview" class="grow">
                <h3 class="m-2">
                  <SvgFile class="inline size-8 fill-blue-300" />
                  <a class="break-all align-middle text-lg font-semibold text-sky-500 underline hover:text-sky-600 hover:decoration-2" href="/api/getFile/{routeNow.getSegments().join('/')}">{currentNode.name}</a>
                </h3>
                <span class="m-2 block text-sm">
                  <p class="inline-block max-w-full truncate rounded-full border px-2 py-1 before:content-['字节:_']"><span class="ifnocss">Size: </span>{currentNode.size}</p>
                  <p class="inline-block max-w-full truncate rounded-full border px-2 py-1 before:content-['时间:_']"><span class="ifnocss">Birth: </span>{currentNode.birth}</p>
                  <p class="inline-block max-w-full truncate rounded-full border px-2 py-1 before:content-['MIME:_']"><span class="ifnocss">MIME: </span>{currentNode.mime}</p>
                  <p class="inline-block max-w-full truncate rounded-full border px-2 py-1 before:content-['MD5:_']"><span class="ifnocss">MD5: </span>{currentNode.md5}</p>
                  <p class="inline-block max-w-full truncate rounded-full border px-2 py-1 before:content-['SHA1:_']"><span class="ifnocss">SHA1: </span>{currentNode.sha1}</p>
                  <p class="inline-block max-w-full truncate rounded-full border px-2 py-1 before:content-['ID:_']"><span class="ifnocss">ID: </span>{currentNode.id}</p>
                </span>
              </div>
            {/if}
          {:catch e}
            <div id="list-notfound" class="grow">
              <p class="p-2">{e.message}</p>
            </div>
          {/await}
        {:catch e}
          <div id="list-loadfailed" class="grow">
            <p class="p-2">加载文件树失败: {e.message}</p>
          </div>
        {/await}
      </div>
    {:else if routeNow.getAction() === "#setting#"}
      <div id="setting" class="grow">
        <div class="box-border border-b p-2">
          <span class="block px-2 py-1">设置</span>
        </div>
        <div class="p-2">WIP</div>
      </div>
    {:else}
      <div id="error" class="grow">
        <div class="p-2">
          <p>未知的操作: {routeNow.getAction()}</p>
          <p>发生什么事了，你怎么跑到这来了？</p>
        </div>
      </div>
    {/if}
  </div>
</div>
