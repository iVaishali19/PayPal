import { join } from 'path';

// The shared .proto files live at <repo-root>/libs/shared/proto.
// Whether we run from src/ (ts-node) or dist/ (compiled), going up three
// levels lands us on the repo root. In Docker we replicate the same layout.
export function protoPath(fileName: string): string {
  const override = process.env.PROTO_DIR;
  if (override) {
    return join(override, fileName);
  }
  return join(__dirname, '..', '..', '..', 'libs', 'shared', 'proto', fileName);
}
