// Contact sheet: swift sheet.swift <out.png> <cols> <img>...  (captions: file names)
import AppKit
let a = CommandLine.arguments
let out = a[1], cols = Int(a[2])!, files = Array(a[3...])
let w: CGFloat = 300, h: CGFloat = 650, cap: CGFloat = 28
let rows = (files.count + cols - 1) / cols
let W = CGFloat(cols) * w, H = CGFloat(rows) * (h + cap)
let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: Int(W), pixelsHigh: Int(H), bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
NSColor.gray.setFill(); NSRect(x: 0, y: 0, width: W, height: H).fill()
for (i, f) in files.enumerated() {
  let c = CGFloat(i % cols), r = CGFloat(i / cols)
  let y = H - (r + 1) * (h + cap)
  if let img = NSImage(contentsOfFile: f) {
    let s = min(w / img.size.width, h / img.size.height)
    let iw = img.size.width * s, ih = img.size.height * s
    img.draw(in: NSRect(x: c * w + (w - iw) / 2, y: y + cap + (h - ih) / 2, width: iw, height: ih))
  }
  let name = (f as NSString).lastPathComponent
  (name as NSString).draw(at: NSPoint(x: c * w + 6, y: y + 6), withAttributes: [.font: NSFont.systemFont(ofSize: 14), .foregroundColor: NSColor.white])
}
NSGraphicsContext.current = nil
try! rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: out))
