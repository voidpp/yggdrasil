import pytest

from yggdrasil.components.reddit import ImageTitleMetadata, parse_image_title


@pytest.mark.parametrize(
    "raw_title, expected_result",
    [
        ("Coyote Buttes, Utah [OC] [2916x3839]", ImageTitleMetadata("Coyote Buttes, Utah", 2916, 3839, True)),
        (
            "My Close Encounter with the Devil's Monument, Wyoming [OC][4000x2666]",
            ImageTitleMetadata("My Close Encounter with the Devil's Monument, Wyoming", 4000, 2666, True),
        ),
        (
            "Autumn arrives in Lutsen, MN (OC) [1200 x 2500]",
            ImageTitleMetadata("Autumn arrives in Lutsen, MN", 1200, 2500, True),
        ),
        (
            "Banff Valley of the Larches [OC](6048x4024)",
            ImageTitleMetadata("Banff Valley of the Larches", 6048, 4024, True),
        ),
        (
            "Banff Valley of the Larches (6048x4024)",
            ImageTitleMetadata("Banff Valley of the Larches", 6048, 4024, False),
        ),
        (
            "5 minutes before sunset in Lofoten, northern Norway [7238x4825][OC]",
            ImageTitleMetadata("5 minutes before sunset in Lofoten, northern Norway", 7238, 4825, True),
        ),
        (
            "First snowfall at Mount Chester, Kananaskis, Canada [OC 3024 x 4032]",
            ImageTitleMetadata("First snowfall at Mount Chester, Kananaskis, Canada [OC 3024 x 4032]"),
        ),
        (
            "Popocatepetl Volcan, Puebla Mexico [OC][3965×2475]",
            ImageTitleMetadata("Popocatepetl Volcan, Puebla Mexico", 3965, 2475, True),
        ),
    ],
)
def test_parse_image_title(raw_title: str, expected_result: ImageTitleMetadata):
    assert parse_image_title(raw_title) == expected_result
