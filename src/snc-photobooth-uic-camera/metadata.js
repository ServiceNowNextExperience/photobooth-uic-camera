export function setupAppMetadata({ document }) {
   const head = document.getElementsByTagName("head")[0];
   head.appendChild(createMetaTag("apple-mobile-web-app-capable", "yes"));
   head.appendChild(createMetaTag("apple-mobile-web-app-status-bar-style", "black"));
   head.appendChild(createMetaTag("apple-mobile-web-app-title", "Photobooth"));
   head.appendChild(createLinkTag("apple-touch-icon", "x_snc_pb_app.photobooth_touch_icon_180.png"));
   head.appendChild(createLinkTag("apple-touch-startup-image", "x_snc_pb_app.photobooth_launch.png"));

   function createLinkTag(rel, href, sizes) {
      const link = document.createElement("link");
      if (rel) {
         link.setAttribute("rel", rel);
      }
      if (href) {
         link.setAttribute("href", href);
      }
      if (sizes) {
         link.setAttribute("sizes", sizes);
      }
      return link;
   }

   function createMetaTag(name, content) {
      const meta = document.createElement("meta");
      meta.setAttribute("name", name);
      meta.setAttribute("content", content);
      return meta;
   }
}

