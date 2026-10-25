import AppKit
import CoreGraphics
// frame <in.png> <out.png> <width>: resize, round the corners, draw a thin border.
let a = CommandLine.arguments
let src = NSImage(contentsOfFile: a[1])!.cgImage(forProposedRect: nil, context: nil, hints: nil)!
let w = Int(a[3])!, h = Int(Double(src.height) * Double(w) / Double(src.width))
let ctx = CGContext(data: nil, width: w, height: h, bitsPerComponent: 8, bytesPerRow: 0,
  space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
ctx.interpolationQuality = .high
let r = CGFloat(w) * 0.075
let rect = CGRect(x: 0, y: 0, width: w, height: h).insetBy(dx: 1, dy: 1)
let path = CGPath(roundedRect: rect, cornerWidth: r, cornerHeight: r, transform: nil)
ctx.addPath(path); ctx.clip()
ctx.draw(src, in: CGRect(x: 0, y: 0, width: w, height: h))
ctx.resetClip()
ctx.addPath(path)
ctx.setStrokeColor(CGColor(srgbRed: 0.55, green: 0.58, blue: 0.62, alpha: 0.6))
ctx.setLineWidth(2)
ctx.strokePath()
let rep = NSBitmapImageRep(cgImage: ctx.makeImage()!)
try! rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: a[2]))
