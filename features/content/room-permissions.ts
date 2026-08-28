type ContentRoomPermission = "*:write" | "*:read" | "comments:write";

export function roomPermissions(editable: boolean): ContentRoomPermission[] {
  return editable
    ? ["*:write"]
    : ["*:read", "comments:write"];
}
