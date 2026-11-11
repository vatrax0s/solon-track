import ctypes
import math

cairo = ctypes.CDLL('libcairo.so.2')

# Define argtypes & restypes
cairo.cairo_image_surface_create.restype = ctypes.c_void_p
cairo.cairo_image_surface_create.argtypes = [ctypes.c_int, ctypes.c_int, ctypes.c_int]

cairo.cairo_create.restype = ctypes.c_void_p
cairo.cairo_create.argtypes = [ctypes.c_void_p]

cairo.cairo_pattern_create_linear.restype = ctypes.c_void_p
cairo.cairo_pattern_create_linear.argtypes = [ctypes.c_double, ctypes.c_double, ctypes.c_double, ctypes.c_double]

cairo.cairo_pattern_add_color_stop_rgb.argtypes = [ctypes.c_void_p, ctypes.c_double, ctypes.c_double, ctypes.c_double, ctypes.c_double]
cairo.cairo_set_source.argtypes = [ctypes.c_void_p, ctypes.c_void_p]
cairo.cairo_set_source_rgb.argtypes = [ctypes.c_void_p, ctypes.c_double, ctypes.c_double, ctypes.c_double]
cairo.cairo_set_source_rgba.argtypes = [ctypes.c_void_p, ctypes.c_double, ctypes.c_double, ctypes.c_double, ctypes.c_double]

cairo.cairo_set_line_width.argtypes = [ctypes.c_void_p, ctypes.c_double]
cairo.cairo_set_line_cap.argtypes = [ctypes.c_void_p, ctypes.c_int]
cairo.cairo_set_line_join.argtypes = [ctypes.c_void_p, ctypes.c_int]

cairo.cairo_move_to.argtypes = [ctypes.c_void_p, ctypes.c_double, ctypes.c_double]
cairo.cairo_line_to.argtypes = [ctypes.c_void_p, ctypes.c_double, ctypes.c_double]
cairo.cairo_curve_to.argtypes = [ctypes.c_void_p, ctypes.c_double, ctypes.c_double, ctypes.c_double, ctypes.c_double, ctypes.c_double, ctypes.c_double]
cairo.cairo_arc.argtypes = [ctypes.c_void_p, ctypes.c_double, ctypes.c_double, ctypes.c_double, ctypes.c_double, ctypes.c_double]
cairo.cairo_close_path.argtypes = [ctypes.c_void_p]

cairo.cairo_stroke.argtypes = [ctypes.c_void_p]
cairo.cairo_fill.argtypes = [ctypes.c_void_p]
cairo.cairo_fill_preserve.argtypes = [ctypes.c_void_p]
cairo.cairo_paint.argtypes = [ctypes.c_void_p]

cairo.cairo_surface_write_to_png.restype = ctypes.c_int
cairo.cairo_surface_write_to_png.argtypes = [ctypes.c_void_p, ctypes.c_char_p]

cairo.cairo_destroy.argtypes = [ctypes.c_void_p]
cairo.cairo_surface_destroy.argtypes = [ctypes.c_void_p]
cairo.cairo_pattern_destroy.argtypes = [ctypes.c_void_p]

CAIRO_FORMAT_ARGB32 = 0
CAIRO_LINE_CAP_ROUND = 1
CAIRO_LINE_JOIN_ROUND = 1

def draw_icon(size, output_path):
    surface = cairo.cairo_image_surface_create(CAIRO_FORMAT_ARGB32, size, size)
    cr = cairo.cairo_create(surface)

    # 1. Background gradient (Royal Blue #2563eb to Indigo #4338ca)
    # matching Header gradient from-blue-600 to-indigo-700
    pat = cairo.cairo_pattern_create_linear(0, 0, size, size)
    cairo.cairo_pattern_add_color_stop_rgb(pat, 0.0, 37/255.0, 99/255.0, 235/255.0)    # #2563eb
    cairo.cairo_pattern_add_color_stop_rgb(pat, 0.5, 59/255.0, 130/255.0, 246/255.0)   # #3b82f6
    cairo.cairo_pattern_add_color_stop_rgb(pat, 1.0, 67/255.0, 56/255.0, 202/255.0)    # #4338ca

    radius = size * 0.22
    # Rounded rect
    cairo.cairo_arc(cr, size - radius, radius, radius, -math.pi / 2, 0)
    cairo.cairo_arc(cr, size - radius, size - radius, radius, 0, math.pi / 2)
    cairo.cairo_arc(cr, radius, size - radius, radius, math.pi / 2, math.pi)
    cairo.cairo_arc(cr, radius, radius, radius, math.pi, 3 * math.pi / 2)
    cairo.cairo_close_path(cr)

    cairo.cairo_set_source(cr, pat)
    cairo.cairo_fill(cr)
    cairo.cairo_pattern_destroy(pat)

    # Subtle inner border / sheen
    border_pat = cairo.cairo_pattern_create_linear(0, 0, 0, size)
    cairo.cairo_pattern_add_color_stop_rgb(border_pat, 0.0, 1.0, 1.0, 1.0)
    cairo.cairo_pattern_add_color_stop_rgb(border_pat, 1.0, 0.3, 0.5, 0.9)
    cairo.cairo_set_source_rgba(cr, 1.0, 1.0, 1.0, 0.18)
    cairo.cairo_set_line_width(cr, size * 0.02)
    cairo.cairo_arc(cr, size - radius, radius, radius, -math.pi / 2, 0)
    cairo.cairo_arc(cr, size - radius, size - radius, radius, 0, math.pi / 2)
    cairo.cairo_arc(cr, radius, size - radius, radius, math.pi / 2, math.pi)
    cairo.cairo_arc(cr, radius, radius, radius, math.pi, 3 * math.pi / 2)
    cairo.cairo_close_path(cr)
    cairo.cairo_stroke(cr)
    cairo.cairo_pattern_destroy(border_pat)

    # 2. Scale of Justice (Lucide scale geometry scaled to center safe-zone)
    # Lucide viewbox is 24x24. We scale and center it in the middle 60% of canvas.
    scale_factor = (size * 0.56) / 24.0
    offset_x = (size - 24.0 * scale_factor) / 2.0
    offset_y = (size - 24.0 * scale_factor) / 2.0

    def pt(x, y):
        return (offset_x + x * scale_factor, offset_y + y * scale_factor)

    cairo.cairo_set_line_cap(cr, CAIRO_LINE_CAP_ROUND)
    cairo.cairo_set_line_join(cr, CAIRO_LINE_JOIN_ROUND)

    # Pans with subtle white fill
    # Left pan: m2 16 3-8 3 8 c-.87.65-1.92 1-3 1 s-2.13-.35-3-1 Z
    p1 = pt(2, 16); p2 = pt(5, 8); p3 = pt(8, 16)
    cairo.cairo_move_to(cr, p1[0], p1[1])
    cairo.cairo_line_to(cr, p2[0], p2[1])
    cairo.cairo_line_to(cr, p3[0], p3[1])
    cairo.cairo_curve_to(cr, pt(7.13, 16.65)[0], pt(7.13, 16.65)[1],
                             pt(6.08, 17)[0], pt(6.08, 17)[1],
                             pt(5, 17)[0], pt(5, 17)[1])
    cairo.cairo_curve_to(cr, pt(2.87, 16.65)[0], pt(2.87, 16.65)[1],
                             pt(2, 16)[0], pt(2, 16)[1],
                             p1[0], p1[1])
    cairo.cairo_close_path(cr)
    cairo.cairo_set_source_rgba(cr, 1.0, 1.0, 1.0, 0.22)
    cairo.cairo_fill_preserve(cr)
    cairo.cairo_set_source_rgb(cr, 1.0, 1.0, 1.0)
    cairo.cairo_set_line_width(cr, scale_factor * 1.8)
    cairo.cairo_stroke(cr)

    # Right pan: m16 16 3-8 3 8 c-.87.65-1.92 1-3 1 s-2.13-.35-3-1 Z
    p1 = pt(16, 16); p2 = pt(19, 8); p3 = pt(22, 16)
    cairo.cairo_move_to(cr, p1[0], p1[1])
    cairo.cairo_line_to(cr, p2[0], p2[1])
    cairo.cairo_line_to(cr, p3[0], p3[1])
    cairo.cairo_curve_to(cr, pt(21.13, 16.65)[0], pt(21.13, 16.65)[1],
                             pt(20.08, 17)[0], pt(20.08, 17)[1],
                             pt(19, 17)[0], pt(19, 17)[1])
    cairo.cairo_curve_to(cr, pt(16.87, 16.65)[0], pt(16.87, 16.65)[1],
                             pt(16, 16)[0], pt(16, 16)[1],
                             p1[0], p1[1])
    cairo.cairo_close_path(cr)
    cairo.cairo_set_source_rgba(cr, 1.0, 1.0, 1.0, 0.22)
    cairo.cairo_fill_preserve(cr)
    cairo.cairo_set_source_rgb(cr, 1.0, 1.0, 1.0)
    cairo.cairo_stroke(cr)

    # Base line: M7 21h10
    cairo.cairo_set_line_width(cr, scale_factor * 2.1)
    b1 = pt(7, 21); b2 = pt(17, 21)
    cairo.cairo_move_to(cr, b1[0], b1[1])
    cairo.cairo_line_to(cr, b2[0], b2[1])
    cairo.cairo_stroke(cr)

    # Central pillar: M12 3v18
    v1 = pt(12, 3); v2 = pt(12, 21)
    cairo.cairo_move_to(cr, v1[0], v1[1])
    cairo.cairo_line_to(cr, v2[0], v2[1])
    cairo.cairo_stroke(cr)

    # Top crossbar: M3 7h2 c2 0 5-1 7-2 2 1 5 2 7 2 h2
    cairo.cairo_move_to(cr, pt(3, 7)[0], pt(3, 7)[1])
    cairo.cairo_line_to(cr, pt(5, 7)[0], pt(5, 7)[1])
    cairo.cairo_curve_to(cr, pt(7, 7)[0], pt(7, 7)[1],
                             pt(10, 6)[0], pt(10, 6)[1],
                             pt(12, 5)[0], pt(12, 5)[1])
    cairo.cairo_curve_to(cr, pt(14, 6)[0], pt(14, 6)[1],
                             pt(17, 7)[0], pt(17, 7)[1],
                             pt(19, 7)[0], pt(19, 7)[1])
    cairo.cairo_line_to(cr, pt(21, 7)[0], pt(21, 7)[1])
    cairo.cairo_stroke(cr)

    cairo.cairo_surface_write_to_png(surface, output_path.encode('utf-8'))
    cairo.cairo_destroy(cr)
    cairo.cairo_surface_destroy(surface)
    print(f"Generated: {output_path} ({size}x{size})")

draw_icon(512, "public/icon-512.png")
draw_icon(192, "public/icon-192.png")
draw_icon(180, "public/apple-touch-icon.png")
draw_icon(64, "public/favicon.ico")
