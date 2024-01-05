<script>
  import avatar from "./avatar.webp";
  import { SvgFile, SvgFire, SvgFolder, SvgLogin, SvgLogout, SvgSetting } from "./components/icons";
  import { Hash, formatBytes } from "./utils";

  const defaultHash = "#list#";
  if (window.location.hash === "") window.location.hash = defaultHash;
  const currentHash = new Hash(decodeURIComponent(location.hash));

  const userInfo = document.cookie.includes("id_token") ? JSON.parse(window.localStorage.getItem("user_info")) : { nickname: "everyone", picture: avatar };
  const isLogined = document.cookie.includes("id_token") && (userInfo?.nickname || "everyone") !== "everyone";

  let showBzEmpty = localStorage.getItem("hide_bzempty") === "yes" || false;
  $: {
    localStorage.setItem("hide_bzempty", showBzEmpty ? "yes" : "no");
  }
</script>

<svelte:window
  on:hashchange={(e) => {
    if (new URL(e.newURL).hash === "") location.hash = defaultHash;
    currentHash.value = decodeURIComponent(new URL(e.newURL).hash);
  }}
/>

<div id="app-root" class="flex h-full flex-col">
  <div class="box-border flex overflow-x-auto border-b">
    <h1 id="title" class="p-1.5">
      <a href={import.meta.env.BASE_URL} class="block size-11 rounded-full fill-red-600 font-semibold hover:bg-gray-100 active:hover:bg-gray-200"><SvgFire class="size-full" /></a>
      <a href={import.meta.env.BASE_URL} class="ifnocss">BlazeFlare</a>
    </h1>

    <ul id="navigator" class="ml-auto box-border flex gap-1.5 p-1.5">
      <li>
        <a href="{import.meta.env.BASE_URL}#list#" class="block size-11 rounded-full p-1.5 {currentHash.getAction() === '#list#' ? 'border border-yellow-500 fill-yellow-500' : 'fill-gray-300'} hover:bg-gray-100 active:hover:bg-gray-200"><SvgFolder class="size-full" /></a>
        <a href="{import.meta.env.BASE_URL}#list#" class="ifnocss">文件</a>
      </li>
      {#if isLogined}
        <li>
          <a href="{import.meta.env.BASE_URL}#setting#" class="block size-11 rounded-full {currentHash.getAction() === '#setting#' ? 'border border-blue-500 fill-blue-500' : 'fill-gray-300'} hover:bg-gray-100 active:hover:bg-gray-200"><img src={userInfo.picture} class="size-full" alt="user avatar" /></a>
          <a href="{import.meta.env.BASE_URL}#setting#" class="ifnocss">设置</a>
        </li>
      {:else}
        <li>
          <a href="{import.meta.env.BASE_URL}#setting#" class="block size-11 rounded-full p-1.5 {currentHash.getAction() === '#setting#' ? 'border border-blue-500 fill-blue-500' : 'fill-gray-300'} hover:bg-gray-100 active:hover:bg-gray-200"><SvgSetting class="size-full" /></a>
          <a href="{import.meta.env.BASE_URL}#setting#" class="ifnocss">设置</a>
        </li>
      {/if}
    </ul>
  </div>

  <div id="action" class="flex grow flex-col">
    {#if currentHash.getAction() === "#list#"}
      <div id="list" class="flex grow flex-col">
        <p class="ifnocss">位置</p>
        <ul id="list-breadcrumb" class="box-border flex flex-wrap items-center gap-1 border-b p-2 text-gray-500">
          <li>
            {#if currentHash.getPrefixInfixSuffix() !== ""}
              <a href="{import.meta.env.BASE_URL}{currentHash.getAction()}" class="block rounded-full bg-gray-50 px-2 py-1 hover:bg-gray-100 active:hover:bg-gray-200">根目录</a>
            {:else}
              <span class="block rounded-full px-2 py-1 text-black">根目录</span>
            {/if}
          </li>
          {#each currentHash.getSegments() as segment, i}
            <span class="before:content-['/']"></span>
            {#if i !== currentHash.getSegments().length - 1}
              <li class="max-w-full">
                <a
                  href="{import.meta.env.BASE_URL}{currentHash.getAction()}{currentHash
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
        {#await fetch(`/api/getTree/${isLogined ? userInfo.nickname : "everyone"}`).then((res) => res.json())}
          <div id="list-loading" class="grow">
            <p class="p-2">正在加载文件树...</p>
          </div>
        {:then tree}
          {#await new Promise((resolve, reject) => {
            let current = tree;
            const segments = currentHash.getSegments();
            for (let i = 0; i < segments.length; ++i) {
              const segment = segments[i];
              let find = current.nodes.find((node) => (i !== segments.length - 1 ? node.isFolder : node.isFolder === currentHash.isFolder()) && node.name === segment);
              if (find === undefined) return reject(new Error("文件树中找不到该文件(夹)"));
              current = find;
            }
            return resolve(current);
          }) then currentNode}
            <p class="ifnocss">文件</p>
            {#if currentHash.isFolder()}
              <ul id="list-folderview" class="h-0 grow overflow-y-auto overscroll-y-none">
                {#each currentNode.nodes.filter((node) => (showBzEmpty ? true : node.name !== ".bzEmpty")) as node}
                  <li>
                    <a class="box-border flex gap-2 border-b p-2 hover:bg-gray-100 active:hover:bg-gray-200" href="{import.meta.env.BASE_URL}{currentHash.value}{node.name}{node.isFolder ? '/' : ''}">
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
                  <a class="break-all align-middle text-lg font-semibold text-sky-500 underline hover:text-sky-600 hover:decoration-2" href="/api/getFile/{currentHash.getSegments().join('/')}">{currentNode.name}</a>
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
    {:else if currentHash.getAction() === "#setting#"}
      <div id="setting" class="grow">
        <div class="box-border border-b p-2">
          <span class="block px-2 py-1">设置</span>
        </div>

        <div class="flex h-14 items-center truncate border-b">
          <img src={isLogined ? userInfo.picture : avatar} alt="user avatar" class="ml-2 box-border inline-block h-12 rounded-full border" />
          <span class="ml-2 inline-block text-lg">{isLogined ? userInfo.nickname : "请登入"}</span>
          {#if isLogined}
            <a href="{import.meta.env.BASE_URL}user/logout.html" class="ml-auto box-border block size-14 border-l fill-gray-300 p-3 hover:bg-gray-100 active:hover:bg-gray-200"><SvgLogout class="size-full" /></a>
            <a href="{import.meta.env.BASE_URL}user/logout.html" class="ifnocss">登出</a>
          {:else}
            <a href="{import.meta.env.BASE_URL}user/login.html" class="ml-auto box-border block size-14 shrink-0 border-l fill-gray-300 p-3 hover:bg-gray-100 active:hover:bg-gray-200"><SvgLogin class="size-full" /></a>
            <a href="{import.meta.env.BASE_URL}user/login.html" class="ifnocss">登入</a>
          {/if}
        </div>
        <div class="flex h-14 items-center border-b p-4">
          显示 .bzEmpty
          <label class="relative ml-auto inline-flex cursor-pointer items-center">
            <input type="checkbox" bind:checked={showBzEmpty} class="peer sr-only" />
            <div class="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-500 peer-checked:after:translate-x-full peer-focus:outline-none"></div>
          </label>
        </div>
      </div>
    {:else}
      <div id="error" class="grow">
        <div class="p-2">
          <p>未知的操作: {currentHash.getAction()}</p>
          <p>发生什么事了，你怎么跑到这来了？</p>
        </div>
      </div>
    {/if}
  </div>
</div>
