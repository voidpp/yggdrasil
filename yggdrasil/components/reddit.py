import logging
import re
from dataclasses import dataclass

from fake_useragent import UserAgent
from httpx import AsyncClient
from pydantic import BaseModel

logger = logging.getLogger(__name__)


class EarthPornImage(BaseModel):
    url: str
    title: str
    thumbnail_url: str
    id: str


async def get_earth_porn_json():
    async with AsyncClient() as client:
        logger.info("Fetching EarthPorn.json from reddit.com")
        headers = {
            "User-Agent": UserAgent().random,
        }
        response = await client.get("https://www.reddit.com/r/EarthPorn.json", headers=headers)
        return response.json()


@dataclass
class ImageTitleMetadata:
    title: str
    width: int = None
    height: int = None
    is_original_content: bool = None


dimensions_pattern = re.compile(r"(\[|\()([0-9]{3,})\s*(x|×|X)\s*([0-9]{3,})(\]|\))")
oc_pattern = re.compile(r"(\[|\()OC(\]|\))")


def parse_image_title(raw_title: str) -> ImageTitleMetadata:
    dimensions_matches = dimensions_pattern.search(raw_title)
    if not dimensions_matches:
        return ImageTitleMetadata(raw_title)

    title = dimensions_pattern.sub("", raw_title)
    title = oc_pattern.sub("", title).strip()

    return ImageTitleMetadata(
        title=title,
        width=int(dimensions_matches.group(2)),
        height=int(dimensions_matches.group(4)),
        is_original_content=oc_pattern.search(raw_title) is not None,
    )


def get_earth_porn_images(subreddit_json: dict):
    return [
        EarthPornImage(
            url=post["data"]["url"],
            title=parse_image_title(post["data"]["title"]).title,
            thumbnail_url=post["data"]["thumbnail"],
            id=post["data"]["id"],
        )
        for post in subreddit_json["data"]["children"]
    ]
