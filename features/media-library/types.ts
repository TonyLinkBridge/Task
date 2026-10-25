export type MediaAsset = { id:string; storagePath:string; fileName:string; mimeType:string; byteSize:number; uploaderId:string; createdAt:string; archivedAt:string|null; tags?:string[] };
export type SignedAssetUpload = { assetId:string; storagePath:string; token:string; signedUrl:string };
