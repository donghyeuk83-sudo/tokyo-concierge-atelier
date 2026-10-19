# Photo-type filter and Commons candidate rejection (2026-10-20)

## Site change

The established **131 venue records**, **89 image mappings**, **45 external source links**, and **42 missing-photo venues** are preserved. The existing photo filter now separately lists venue-specific photos (83 mappings) and expressly labelled host-building exterior photos (6 mappings); its all-photos and external-source options are unchanged. Translations are available in English, Japanese and Korean, including the compact iPhone select box.

This feature concerns the *kind of subject photographed*, not an assertion that all 83 legacy photos have undergone a new independent commercial reuse clearance. Building exteriors remain correctly credited and identified in their cards.

## Newly screened Commons matches that are unsuitable

| Target | Original work / rights | Actual depicted venue | Decision |
| --- | --- | --- | --- |
| Bikkuri Sushi Ebisu, Tokyo (r42) | [Bikkuri-sushi 20190705-01.jpg](https://commons.wikimedia.org/wiki/File:Bikkuri-sushi_20190705-01.jpg), original author 円周率３パーセント, CC BY-SA 4.0 | **Nagoya City Kita-ku Kusunokiajima** restaurant; the original Commons description and categories do not identify the Ebisu branch. | Do not publish as Ebisu. Existing external Tokyo shop gallery remains linked. |
| Seirinkan pizza, Nakameguro (r06) | [Seirinkan High School Hommachi Campus.JPG](https://commons.wikimedia.org/wiki/File:Seirinkan_High_School_Hommachi_Campus.JPG), original author Abasaa, public domain dedication | **Seirinkan High School, Tsushima, Aichi**, not the Tokyo pizzeria. | Reject despite rights that would otherwise permit reuse. |

The 42 pending venues require more original-file and precise-branch research. The absence of a candidate is not proof no commercial-licensed image exists. No new photo files are published by this PR.

## GitHub Actions condition

At the start of this task, the latest commit 076c186's Pages and Chromium jobs were queued. The older 960e8b5 local Chromium check passed but its public-revision wait failed when its Pages deploy was cancelled. Do not claim public Pages/Chromium success for this feature until GitHub Actions actually completes.
