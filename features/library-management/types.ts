export type SnippetKind='template'|'hashtag_set'|'saved_reply';
export type LibrarySnippet={id:string;kind:SnippetKind;title:string;body:string;ownerId:string;revision:number;useCount:number;createdAt:string;updatedAt:string;archivedAt:string|null};
export type LibraryOrganization={favorites:string[];usage:Record<string,number>;snippets:LibrarySnippet[]};
export type Result<T>={ok:true;data:T}|{ok:false;message:string};
export const snippetLabels:Record<SnippetKind,string>={template:'文案模板',hashtag_set:'Hashtag 集',saved_reply:'快捷回复'};
