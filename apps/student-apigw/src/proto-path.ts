import { join } from 'path';

export function protoPath(fileName: string): string {
  const override = process.env.PROTO_DIR;
  if (override) {
    return join(override, fileName);
  }
  return join(__dirname, '..', '..', '..', 'libs', 'shared', 'proto', fileName);
}
