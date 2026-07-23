import ast
import fitz
import logging
from pathlib import Path
import time
import unittest
from unittest.mock import Mock


def load_add_footer_polygon():
    source_path = Path(__file__).with_name("exportfile.py")
    tree = ast.parse(source_path.read_text(encoding="utf-8"), filename=str(source_path))
    function = next(
        node
        for node in tree.body
        if isinstance(node, ast.FunctionDef) and node.name == "add_footer_polygon"
    )
    module = ast.fix_missing_locations(ast.Module(body=[function], type_ignores=[]))
    namespace = {
        "time": time,
        "logging": logging,
        "fitz": type("FakeFitz", (), {"Font": Mock(return_value=object())}),
        "drow_ract": Mock(),
        "draw_doclink": Mock(),
        "draw_weblink": Mock(),
    }
    exec(compile(module, str(source_path), "exec"), namespace)
    return namespace


def load_drow_ract():
    source_path = Path(__file__).with_name("exportfile.py")
    tree = ast.parse(source_path.read_text(encoding="utf-8"), filename=str(source_path))
    function = next(
        node
        for node in tree.body
        if isinstance(node, ast.FunctionDef) and node.name == "drow_ract"
    )
    module = ast.fix_missing_locations(ast.Module(body=[function], type_ignores=[]))
    namespace = {
        "fitz": fitz,
        "logging": logging,
        "hex_to_rgba": Mock(return_value=(0.0, 0.4, 1.0)),
        "rotate_rect": lambda rect, _rotation, _centre: rect,
        "draw_rounded_rect": Mock(),
        "draw_image": Mock(),
    }
    exec(compile(module, str(source_path), "exec"), namespace)
    return namespace


def load_draw_doclink():
    source_path = Path(__file__).with_name("exportfile.py")
    tree = ast.parse(source_path.read_text(encoding="utf-8"), filename=str(source_path))
    function = next(
        node
        for node in tree.body
        if isinstance(node, ast.FunctionDef) and node.name == "draw_doclink"
    )
    module = ast.fix_missing_locations(ast.Module(body=[function], type_ignores=[]))
    namespace = {
        "fitz": fitz,
        "logging": logging,
        "hex_to_rgba": lambda color: {
            "#5aa8ff": (90 / 255, 168 / 255, 1.0),
            "#ff0000": (1.0, 0.0, 0.0),
        }[color.lower()],
        "rotate_rect": lambda rect, _rotation, _centre: rect,
        "get_max_min_value": Mock(return_value={"frm": 20, "to": 28}),
        "draw_image": Mock(),
    }
    exec(compile(module, str(source_path), "exec"), namespace)
    return namespace


class FakePage:
    rotation = 0

    def wrap_contents(self):
        pass


class DocumentHighlightRoutingTest(unittest.TestCase):
    def test_document_linked_highlight_uses_doclink_renderer(self):
        namespace = load_add_footer_polygon()
        page = FakePage()
        data = {
            "cOrientation": "A",
            "highlights": [
                {
                    "page": 1,
                    "type": "highlight",
                    "linktype": "D",
                    "rects": [{"x": 10, "y": 20, "width": 30, "height": 8}],
                }
            ],
        }

        namespace["add_footer_polygon"]([page], 0, 1, data)

        namespace["draw_doclink"].assert_called_once_with([], data["highlights"][0], page, 0)
        namespace["drow_ract"].assert_not_called()

    def test_highlight_fill_uses_multiply_blend_so_text_stays_above_it(self):
        namespace = load_drow_ract()
        page = Mock()
        page.rect = fitz.Rect(0, 0, 745, 421)
        rect_annot = Mock()
        page.add_rect_annot.return_value = rect_annot
        annotation = {
            "page": 1,
            "type": "highlight",
            "linktype": "F",
            "color": "#0066FF",
            "rects": [{"x": 10, "y": 20, "width": 30, "height": 8}],
        }

        namespace["drow_ract"]([], annotation, page, 0)

        page.add_rect_annot.assert_called_once_with(fitz.Rect(10, 20, 40, 28))
        rect_annot.set_colors.assert_called_once_with(
            stroke=(),
            fill=(0.0, 0.4, 1.0),
        )
        rect_annot.set_border.assert_called_once_with(width=0)
        rect_annot.update.assert_called_once_with(opacity=0.4, blend_mode="Multiply")
        page.draw_rect.assert_not_called()

    def test_document_text_link_is_a_blue_dotted_underline(self):
        namespace = load_draw_doclink()
        page = Mock()
        page.rect = fitz.Rect(0, 0, 745, 421)
        annotation = {
            "page": 1,
            "type": "highlight",
            "linktype": "D",
            "color": "#ff0000",
            "rects": [{"x": 10, "y": 20, "width": 30, "height": 8}],
        }

        namespace["draw_doclink"]([], annotation, page, 0)

        underline = page.draw_line.call_args
        self.assertEqual(underline.kwargs["color"], (90 / 255, 168 / 255, 1.0))
        self.assertIsNotNone(underline.kwargs["dashes"])
        page.draw_rect.assert_not_called()

    def test_document_area_link_is_a_light_blue_dotted_region(self):
        namespace = load_draw_doclink()
        page = Mock()
        page.rect = fitz.Rect(0, 0, 745, 421)
        annotation = {
            "page": 1,
            "type": "area",
            "linktype": "D",
            "color": "#ff0000",
            "rects": [{"x": 10, "y": 20, "width": 30, "height": 8}],
        }

        namespace["draw_doclink"]([], annotation, page, 0)

        region = page.draw_rect.call_args
        self.assertEqual(region.kwargs["color"], (90 / 255, 168 / 255, 1.0))
        self.assertEqual(region.kwargs["fill_opacity"], 0.16)
        self.assertIsNotNone(region.kwargs["dashes"])


if __name__ == "__main__":
    unittest.main()
