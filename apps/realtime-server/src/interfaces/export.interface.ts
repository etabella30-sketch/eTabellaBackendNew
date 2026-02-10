import { IsItUUID } from "@app/global/decorator/is-uuid-nullable.decorator";

export class exportRes {
  msg: number;
  path?: string;
  name?: string;
  value?: any;
}