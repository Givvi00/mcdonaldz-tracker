// Hand-drawn food icons (burger, fries, drink, nuggets, McFlurry, ...) as an SVG sprite.
// Generated from the approved preview page: edit the drawings there and regenerate, do not tweak by hand.
// Each icon is a <symbol id="food-NAME"> on a 48x48 grid; clip paths are "food-clip-NAME".
// Colours are fixed; the outline comes from the element that uses the icon (stroke, --sw for the thick halo strokes).
export const FOOD_SPRITE = `
<clipPath id="food-clip-fries"><path d="M8 24 C14 26 34 26 40 24 L37 44 H11 Z"/></clipPath>
<clipPath id="food-clip-cup"><path d="M11 16.5 H37 L34 44 H14 Z"/></clipPath>
<clipPath id="food-clip-flurry"><path d="M11.5 27 H36.5 L33.6 44 H14.4 Z"/></clipPath>
<clipPath id="food-clip-toast"><rect x="6.5" y="13" width="35" height="11.5" rx="4"/></clipPath>
<clipPath id="food-clip-basket"><path d="M5 27 H43 L39.5 44 H8.5 Z"/></clipPath>
<symbol id="food-burger" viewBox="0 0 48 48">
      <path d="M8 35 H40 V37.5 C40 41 37 43 34 43 H14 C11 43 8 41 8 37.5 Z" fill="#F0A53A"/>
      <rect x="6" y="29" width="36" height="7" rx="3.5" fill="#6B3A1E"/>
      <path d="M6.5 25.5 H41.5 V29 H38 L33 36.5 L28 29 H6.5 Z" fill="#FFC72C"/>
      <path d="M5 25 q3.5 -4 7 0 t7 0 t7 0 t7 0 t7 0 V27 H5 Z" fill="#6FBF4B"/>
      <path d="M7 23 C7 13 15 7 24 7 C33 7 41 13 41 23 Z" fill="#F0A53A"/>
      <g fill="#FFF1D6" stroke="none">
        <ellipse cx="16" cy="15" rx="1.9" ry="1.1" transform="rotate(-25 16 15)"/><ellipse cx="24" cy="12" rx="1.9" ry="1.1"/>
        <ellipse cx="32" cy="15" rx="1.9" ry="1.1" transform="rotate(25 32 15)"/><ellipse cx="20" cy="19" rx="1.9" ry="1.1" transform="rotate(-10 20 19)"/>
        <ellipse cx="28" cy="19" rx="1.9" ry="1.1" transform="rotate(10 28 19)"/>
      </g>
    </symbol>
<symbol id="food-bigmac" viewBox="0 0 48 48">
      <path d="M9 37.5 H39 V39.5 C39 42.2 36.8 44 34 44 H14 C11.2 44 9 42.2 9 39.5 Z" fill="#F0A53A"/>
      <rect x="7" y="32" width="34" height="6" rx="3" fill="#6B3A1E"/>
      <rect x="8.5" y="26" width="31" height="5.5" rx="2.6" fill="#F0A53A"/>
      <path d="M7.5 30.5 H40.5 V33.5 H37 L32.5 39.5 L28 33.5 H7.5 Z" fill="#FFC72C"/>
      <rect x="7" y="20.5" width="34" height="6" rx="3" fill="#6B3A1E"/>
      <path d="M6 20 q3 -3.6 6 0 t6 0 t6 0 t6 0 t6 0 t6 0 V22 H6 Z" fill="#6FBF4B"/>
      <path d="M8 19 C8 11 15 6 24 6 C33 6 40 11 40 19 Z" fill="#F0A53A"/>
      <g fill="#FFF1D6" stroke="none">
        <ellipse cx="17" cy="12.5" rx="1.8" ry="1" transform="rotate(-25 17 12.5)"/><ellipse cx="24" cy="10" rx="1.8" ry="1"/>
        <ellipse cx="31" cy="12.5" rx="1.8" ry="1" transform="rotate(25 31 12.5)"/><ellipse cx="21" cy="16" rx="1.8" ry="1"/>
        <ellipse cx="28" cy="16" rx="1.8" ry="1"/>
      </g>
    </symbol>
<symbol id="food-chicken" viewBox="0 0 48 48">
      <path d="M8 35 H40 V37.5 C40 41 37 43 34 43 H14 C11 43 8 41 8 37.5 Z" fill="#F0A53A"/>
      <path d="M6 30 C4.5 33 6 36 9 36 H39 C42 36 43.5 33 42 30 C41 27.5 38 27 35 28 C30 26.5 18 26.5 13 28 C10 27 7 27.5 6 30 Z" fill="#E8A33D"/>
      <g fill="#B8741A" stroke="none"><circle cx="12" cy="32" r=".9"/><circle cx="20" cy="31" r=".9"/><circle cx="28" cy="32.5" r=".9"/><circle cx="36" cy="31.5" r=".9"/></g>
      <path d="M6 26 q3.5 -4 7 0 t7 0 t7 0 t7 0 t7 0 V28 H6 Z" fill="#6FBF4B"/>
      <path d="M7 24 C7 14 15 8 24 8 C33 8 41 14 41 24 Z" fill="#F0A53A"/>
      <g fill="#FFF1D6" stroke="none">
        <ellipse cx="16" cy="16" rx="1.9" ry="1.1" transform="rotate(-25 16 16)"/><ellipse cx="24" cy="13" rx="1.9" ry="1.1"/>
        <ellipse cx="32" cy="16" rx="1.9" ry="1.1" transform="rotate(25 32 16)"/><ellipse cx="20" cy="20" rx="1.9" ry="1.1"/><ellipse cx="28" cy="20" rx="1.9" ry="1.1"/>
      </g>
    </symbol>
<symbol id="food-toast" viewBox="0 0 48 48">
      <rect x="6.5" y="30" width="35" height="8" rx="3" fill="#EDB458"/>
      <path d="M5 27.5 H43 V29.5 C43 31 41.6 32 40 32 H8 C6.4 32 5 31 5 29.5 Z" fill="#F4A3AE"/>
      <path d="M6 24 H42 V27.5 H38 L33 34.5 L28 27.5 H6 Z" fill="#FFC72C"/>
      <rect x="6.5" y="13" width="35" height="11.5" rx="4" fill="#EDB458"/>
      <g clip-path="url(#food-clip-toast)" stroke="#A8672A" stroke-width="1.6" fill="none"><path d="M13 13 L8 24.5 M20 13 L15 24.5 M27 13 L22 24.5 M34 13 L29 24.5 M41 13 L36 24.5"/></g>
      <rect x="6.5" y="13" width="35" height="11.5" rx="4" fill="none"/>
    </symbol>
<symbol id="food-filet" viewBox="0 0 48 48">
      <path d="M8 35.5 H40 V37 C40 40.6 37.5 42.8 34 42.8 H14 C10.5 42.8 8 40.6 8 37 Z" fill="#F7DCA6"/>
      <path d="M5.5 30 H42.5 L39.5 36.4 L35.5 32.5 L24 36.4 L12.5 32.5 L8.5 36.4 Z" fill="#FFC72C"/>
      <path d="M3.5 26 C3 23.6 4.6 22.5 6.6 22.5 H41.4 C43.4 22.5 45 23.6 44.5 26 L44 29.4 C43.8 31 42.5 31.5 40.6 31.5 H7.4 C5.5 31.5 4.2 31 4 29.4 Z" fill="#E2A14A"/>
      <g fill="#B8741A" stroke="none"><circle cx="8" cy="27.6" r=".9"/><circle cx="16" cy="29.4" r=".9"/><circle cx="24" cy="28" r=".9"/><circle cx="32" cy="29.4" r=".9"/><circle cx="40" cy="27.6" r=".9"/></g>
      <ellipse cx="9.4" cy="28.6" rx="2" ry="2.8" fill="#FFFFFF"/>
      <ellipse cx="38.8" cy="29" rx="2" ry="3" fill="#FFFFFF"/>
      <ellipse cx="11" cy="24.4" rx="6.6" ry="3.2" fill="#FFFFFF"/>
      <ellipse cx="37" cy="24.6" rx="6.6" ry="3.4" fill="#FFFFFF"/>
      <path d="M7 23.5 C7 12 14 6 24 6 C34 6 41 12 41 23.5 Z" fill="#F3C98B"/>
      <path d="M13 16 C15 11.5 19 9.2 23 9.2" stroke="#FFFFFF" stroke-width="1.6" fill="none" opacity=".75"/>
    </symbol>
<symbol id="food-wrap" viewBox="0 0 48 48">
      <g transform="translate(24 27) rotate(-30) scale(0.9) translate(-24 -27)">
        <path d="M15 15 H33 V37 C33 41 29 43.5 24 43.5 C19 43.5 15 41 15 37 Z" fill="#F2D19A"/>
        <path d="M15 31.5 L18 34 L21 31.5 L24 34 L27 31.5 L30 34 L33 31.5 V37 C33 41 29 43.5 24 43.5 C19 43.5 15 41 15 37 Z" fill="#FFC72C"/>
        <path d="M15 15 H33 V37 C33 41 29 43.5 24 43.5 C19 43.5 15 41 15 37 Z" fill="none"/>
        <path d="M15.5 22 C21 24 27 24 32.5 22" stroke="#C9A063" stroke-width="1.4" fill="none"/>
        <ellipse cx="24" cy="15" rx="9" ry="3.6" fill="#F7E3B8"/>
        <path d="M12.5 15 q1.5 -10 6 -5 t6 -6.5 t6 5 t5 1 q1.6 2.6 .3 5.5 Z" fill="#6FBF4B"/>
        <ellipse cx="20" cy="9.6" rx="5.4" ry="3.6" fill="#E8A33D"/>
        <circle cx="30.4" cy="10.2" r="3.4" fill="#DA291C"/>
      </g>
    </symbol>
<symbol id="food-fries" viewBox="0 0 48 48">
      <g fill="#FFC72C">
        <rect x="8" y="9" width="6" height="22" rx="1.8" transform="rotate(-10 11 20)"/>
        <rect x="14" y="5" width="6" height="24" rx="1.8" transform="rotate(-4 17 17)"/>
        <rect x="21" y="6" width="6" height="24" rx="1.8" transform="rotate(3 24 18)"/>
        <rect x="28" y="4" width="6" height="26" rx="1.8" transform="rotate(8 31 17)"/>
        <rect x="34" y="9" width="6" height="22" rx="1.8" transform="rotate(14 37 20)"/>
      </g>
      <path d="M8 24 C14 26 34 26 40 24 L37 44 H11 Z" fill="#DA291C"/>
      <g clip-path="url(#food-clip-fries)"><rect x="4" y="33" width="40" height="5" fill="#FFC72C" stroke="none"/></g>
      <path d="M8 24 C14 26 34 26 40 24 L37 44 H11 Z" fill="none"/>
    </symbol>
<symbol id="food-nuggets" viewBox="0 0 48 48">
      <path d="M22 11 C28 7 38 9 40 16 C43 21 40 28 34 29 C28 32 20 30 19 23 C16 18 18 13 22 11 Z" fill="#E8A33D"/>
      <path d="M6 27 C4 21 10 16 16 18 C22 17 27 21 26 27 C28 33 22 38 16 37 C10 39 6 35 6 27 Z" fill="#EDAE4E"/>
      <path d="M24 33 C26 28 33 28 37 31 C42 33 43 39 39 42 C35 45 28 45 24 42 C21 39 21 36 24 33 Z" fill="#E8A33D"/>
      <g fill="#B8741A" stroke="none">
        <circle cx="29" cy="15" r="1"/><circle cx="34" cy="21" r="1"/><circle cx="30" cy="25" r=".9"/>
        <circle cx="11" cy="26" r="1"/><circle cx="17" cy="31.5" r=".9"/><circle cx="19" cy="24" r=".9"/>
        <circle cx="29" cy="37" r="1"/><circle cx="35" cy="38" r=".9"/><circle cx="32" cy="41" r=".9"/>
      </g>
    </symbol>
<symbol id="food-wings" viewBox="0 0 48 48">
      <g transform="translate(31 14) rotate(158) scale(0.8)">
        <g transform="translate(-6.5 0) rotate(180)"><rect x="0" y="-1.7" width="7.5" height="3.4" rx="1.7" fill="#FFF6E5"/><circle cx="8.6" cy="-2.3" r="2.2" fill="#FFF6E5"/><circle cx="8.6" cy="2.3" r="2.2" fill="#FFF6E5"/></g>
        <path d="M-9 -1.6 C-7 -5.2 -3 -9.4 3 -8.8 C10.4 -8.2 12.6 -1 10 4.8 C7.4 10.6 0 11 -4.2 7.8 C-6.8 5.8 -8.2 3.2 -9 1.6 C-9.7 0.5 -9.7 -0.5 -9 -1.6 Z" fill="#DD9538"/>
        <path d="M-2.5 -7.6 C-1 -3.5 -1 2 -3 8.2" stroke="#B8741A" stroke-width="1.4" fill="none"/>
        <g fill="#B8741A" stroke="none"><circle cx="4" cy="-3" r="1"/><circle cx="5.5" cy="4" r="1"/><circle cx="1" cy="6" r=".9"/></g>
      </g>
      <g transform="translate(18 25) rotate(-12) scale(0.8)">
        <g transform="translate(-6.5 0) rotate(180)"><rect x="0" y="-1.7" width="7.5" height="3.4" rx="1.7" fill="#FFF6E5"/><circle cx="8.6" cy="-2.3" r="2.2" fill="#FFF6E5"/><circle cx="8.6" cy="2.3" r="2.2" fill="#FFF6E5"/></g>
        <path d="M-9 -1.6 C-7 -5.2 -3 -9.4 3 -8.8 C10.4 -8.2 12.6 -1 10 4.8 C7.4 10.6 0 11 -4.2 7.8 C-6.8 5.8 -8.2 3.2 -9 1.6 C-9.7 0.5 -9.7 -0.5 -9 -1.6 Z" fill="#E8A33D"/>
        <path d="M-2.5 -7.6 C-1 -3.5 -1 2 -3 8.2" stroke="#B8741A" stroke-width="1.4" fill="none"/>
        <g fill="#B8741A" stroke="none"><circle cx="4" cy="-3" r="1"/><circle cx="5.5" cy="4" r="1"/><circle cx="1" cy="6" r=".9"/></g>
      </g>
      <g transform="translate(30 34) rotate(196) scale(0.8)">
        <g transform="translate(-6.5 0) rotate(180)"><rect x="0" y="-1.7" width="7.5" height="3.4" rx="1.7" fill="#FFF6E5"/><circle cx="8.6" cy="-2.3" r="2.2" fill="#FFF6E5"/><circle cx="8.6" cy="2.3" r="2.2" fill="#FFF6E5"/></g>
        <path d="M-9 -1.6 C-7 -5.2 -3 -9.4 3 -8.8 C10.4 -8.2 12.6 -1 10 4.8 C7.4 10.6 0 11 -4.2 7.8 C-6.8 5.8 -8.2 3.2 -9 1.6 C-9.7 0.5 -9.7 -0.5 -9 -1.6 Z" fill="#EDAE4E"/>
        <path d="M-2.5 -7.6 C-1 -3.5 -1 2 -3 8.2" stroke="#B8741A" stroke-width="1.4" fill="none"/>
        <g fill="#B8741A" stroke="none"><circle cx="4" cy="-3" r="1"/><circle cx="5.5" cy="4" r="1"/><circle cx="1" cy="6" r=".9"/></g>
      </g>
    </symbol>
<symbol id="food-basket" viewBox="0 0 48 48"><g transform="translate(0 -4.5)">
      <g transform="translate(25.5 29) rotate(82) scale(0.72)">
        <g transform="translate(-6.5 0) rotate(180)"><rect x="0" y="-1.7" width="7.5" height="3.4" rx="1.7" fill="#FFF6E5"/><circle cx="8.6" cy="-2.3" r="2.2" fill="#FFF6E5"/><circle cx="8.6" cy="2.3" r="2.2" fill="#FFF6E5"/></g>
        <path d="M-9 -1.6 C-7 -5.2 -3 -9.4 3 -8.8 C10.4 -8.2 12.6 -1 10 4.8 C7.4 10.6 0 11 -4.2 7.8 C-6.8 5.8 -8.2 3.2 -9 1.6 C-9.7 0.5 -9.7 -0.5 -9 -1.6 Z" fill="#DD9538"/>
        <path d="M-2.5 -7.6 C-1 -3.5 -1 2 -3 8.2" stroke="#B8741A" stroke-width="1.4" fill="none"/>
        <g fill="#B8741A" stroke="none"><circle cx="4" cy="-3" r="1"/><circle cx="5.5" cy="4" r="1"/><circle cx="1" cy="6" r=".9"/></g>
      </g>
      <g transform="translate(35 29.5) rotate(100) scale(0.7)">
        <g transform="translate(-6.5 0) rotate(180)"><rect x="0" y="-1.7" width="7.5" height="3.4" rx="1.7" fill="#FFF6E5"/><circle cx="8.6" cy="-2.3" r="2.2" fill="#FFF6E5"/><circle cx="8.6" cy="2.3" r="2.2" fill="#FFF6E5"/></g>
        <path d="M-9 -1.6 C-7 -5.2 -3 -9.4 3 -8.8 C10.4 -8.2 12.6 -1 10 4.8 C7.4 10.6 0 11 -4.2 7.8 C-6.8 5.8 -8.2 3.2 -9 1.6 C-9.7 0.5 -9.7 -0.5 -9 -1.6 Z" fill="#E8A33D"/>
        <path d="M-2.5 -7.6 C-1 -3.5 -1 2 -3 8.2" stroke="#B8741A" stroke-width="1.4" fill="none"/>
        <g fill="#B8741A" stroke="none"><circle cx="4" cy="-3" r="1"/><circle cx="5.5" cy="4" r="1"/><circle cx="1" cy="6" r=".9"/></g>
      </g>
      <path d="M6 28 C4 21 9 16 15 18 C19.5 17 22 20.5 21 25 C22.5 28.5 19 31 14.5 30.5 C10 31.5 7 30.5 6 28 Z" fill="#EDAE4E"/>
      <path d="M13 30 C12 25 16 21.5 20.5 22.5 C24 23.5 24.5 27.5 23 31 Z" fill="#E8A33D"/>
      <g fill="#B8741A" stroke="none"><circle cx="11" cy="23" r=".9"/><circle cx="16" cy="26.5" r=".9"/><circle cx="20" cy="26" r=".9"/></g>
      </g>
      <path d="M5 27 H43 L39.5 44 H8.5 Z" fill="#DA291C"/>
      <g clip-path="url(#food-clip-basket)"><rect x="3" y="34" width="42" height="4.5" fill="#FFC72C" stroke="none"/></g>
      <path d="M5 27 H43 L39.5 44 H8.5 Z" fill="none"/>
    </symbol>
<symbol id="food-cup" viewBox="0 0 48 48">
      <path d="M27 12 L31 4 H38" fill="none" stroke="#3B2A22" style="stroke-width:calc(var(--sw) + 2.4)"/>
      <path d="M27 12 L31 4 H38" fill="none" stroke="#DA291C" stroke-width="2.4"/>
      <rect x="8.5" y="11" width="31" height="5.5" rx="2.75" fill="#F3E3C8"/>
      <path d="M11 16.5 H37 L34 44 H14 Z" fill="#FFFFFF"/>
      <g clip-path="url(#food-clip-cup)"><rect x="8" y="24" width="32" height="10" fill="#DA291C" stroke="none"/><path d="M17 19 L18.4 40" stroke="#fff" stroke-width="1.6" opacity=".7"/></g>
      <path d="M11 16.5 H37 L34 44 H14 Z" fill="none"/>
    </symbol>
<symbol id="food-mcflurry" viewBox="0 0 48 48">
      <path d="M33 22 L41 4" fill="none" stroke="#3B2A22" style="stroke-width:calc(var(--sw) + 2.4)"/>
      <path d="M33 22 L41 4" fill="none" stroke="#DA291C" stroke-width="2.4"/>
      <path d="M11.5 27 H36.5 L33.6 44 H14.4 Z" fill="#FFFFFF"/>
      <g clip-path="url(#food-clip-flurry)"><path d="M8 30 C16 34 32 34 40 30 V37 C32 41 16 41 8 37 Z" fill="#5A3320" stroke="none"/></g>
      <path d="M11.5 27 H36.5 L33.6 44 H14.4 Z" fill="none"/>
      <path d="M9.5 27 C7 22 12 18.5 24 18.5 C36 18.5 41 22 38.5 27 Z" fill="#FFF6E5"/>
      <path d="M13 19.5 C11.5 15 16.5 11.5 24 11.5 C31.5 11.5 36.5 15 35 19.5 Z" fill="#FFF6E5"/>
      <path d="M17 12.5 C16 8 20 5 25 5 C24.5 7.5 27 8.5 29 10 C30.5 11 31 12 31 12.5 Z" fill="#FFF6E5"/>
      <g fill="#5A3320" stroke="none">
        <rect x="15" y="22" width="3.2" height="2.2" rx=".6" transform="rotate(-15 16.6 23)"/>
        <rect x="27" y="23" width="3.2" height="2.2" rx=".6" transform="rotate(20 28.6 24)"/>
        <rect x="21" y="15.5" width="3" height="2" rx=".6" transform="rotate(10 22.5 16.5)"/>
        <rect x="29" y="16.5" width="2.8" height="2" rx=".6"/>
      </g>
    </symbol>
<symbol id="food-happy" viewBox="0 0 48 48">
      <path d="M11 20 C11 3.5 21.5 3.5 24 14.5 C26.5 3.5 37 3.5 37 20" fill="none" stroke="#3B2A22" style="stroke-width:calc(var(--sw) + 3.6)"/>
      <path d="M11 20 C11 3.5 21.5 3.5 24 14.5 C26.5 3.5 37 3.5 37 20" fill="none" stroke="#FFC72C" stroke-width="3.6"/>
      <path d="M6 19.5 H42 L38.5 44 H9.5 Z" fill="#DA291C"/>
      <circle cx="18" cy="31" r="2.1" fill="#3B2A22" stroke="none"/><circle cx="30" cy="31" r="2.1" fill="#3B2A22" stroke="none"/>
      <circle cx="18.7" cy="30.2" r=".75" fill="#FFFFFF" stroke="none"/><circle cx="30.7" cy="30.2" r=".75" fill="#FFFFFF" stroke="none"/>
      <ellipse cx="13.6" cy="34.4" rx="2.1" ry="1.3" fill="#FF8FA0" stroke="none"/><ellipse cx="34.4" cy="34.4" rx="2.1" ry="1.3" fill="#FF8FA0" stroke="none"/>
      <path d="M20.5 34 Q24 37.4 27.5 34" fill="none" stroke="#FFC72C" stroke-width="2.2"/>
    </symbol>
`;
