// Vercel: 0 skips this build; 1 continues. A marked checkpoint can be pushed
// without publishing it before its database migration is ready.
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export function ignoreBuild(commitMessage,unchanged){
 return /\[skip vercel\]/i.test(commitMessage)||unchanged;
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const message=process.env.VERCEL_GIT_COMMIT_MESSAGE??spawnSync('git',['log','-1','--format=%B'],{encoding:'utf8'}).stdout??'';
 const unchanged=spawnSync('git',['diff','--quiet','HEAD^','HEAD','.']).status===0;
 process.exit(ignoreBuild(message,unchanged)?0:1);
}
