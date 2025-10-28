/**
 * Computes the CSS variables and class names applied to the widget root and
 * button primitives based on the appearance configuration.
 */
export function computeThemeVars(appearance) {
    if (!appearance) {
        return { style: undefined, className: undefined, button: { primary: undefined, secondary: undefined } };
    }
    const styleVars = {};
    const vars = {
        '--payment-brand': appearance.brandColor,
        '--payment-accent': appearance.accentColor,
        '--payment-background': appearance.backgroundColor,
        '--payment-text': appearance.textColor,
        '--payment-radius': appearance.borderRadius,
        '--payment-card-bg': appearance.card?.backgroundColor,
        '--payment-card-text': appearance.card?.textColor,
        '--payment-card-border': appearance.card?.borderColor,
        '--payment-font-family': appearance.fontFamily,
    };
    Object.entries(vars).forEach(([key, value]) => {
        if (value) {
            styleVars[key] = value;
        }
    });
    if (appearance.fontFamily) {
        styleVars.fontFamily = appearance.fontFamily;
    }
    return {
        style: styleVars,
        className: appearance.className,
        button: {
            primary: appearance.button?.primaryClassName,
            secondary: appearance.button?.secondaryClassName,
        },
    };
}
