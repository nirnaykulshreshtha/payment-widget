import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from './dialog';
import {
    Drawer,
    DrawerClose,
    DrawerContent, DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from './drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import * as React from 'react';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

/**
 * Utility type that forces at least one property of T to be provided.
 */
type RequireAtLeastOne<T, Keys extends keyof T = keyof T> =
    Pick<T, Exclude<keyof T, Keys>> & {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>
}[Keys];

/**
 * FooterOptions accepts custom button components or configuration parameters.
 * Using RequireAtLeastOne ensures that if the consumer provides footerOptions,
 * at least one of the keys must be supplied.
 */
export type FooterOptions = RequireAtLeastOne<
    {
        /** Custom close button component. */
        closeButton?: React.ReactNode;
        /** Custom action button component. */
        actionButton?: React.ReactNode;
        /** Label for the close button (used if custom closeButton isn’t provided). */
        closeButtonLabel?: string;
        /** Label for the action button (used if custom actionButton isn’t provided). */
        actionButtonLabel?: string;
        /** Click handler for the action button (if using the default button). */
        onActionButtonClick?: () => void;
        /** Additional message or content to show in the footer. */
        message?: React.ReactNode;
    },
    // Require at least one of these keys:
    'closeButton' | 'closeButtonLabel' | 'actionButton' | 'actionButtonLabel' | 'onActionButtonClick' | 'message'
>;

interface ResponsiveDialogProps {
    children: React.ReactNode;
    isOpen: boolean;
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>> | ((state: boolean) => void);
    title: string | React.ReactNode;
    description?: string | React.ReactNode;
    desktopDialogClassContent?: string;
    /**
     * Options for configuring the footer.
     * If provided, at least one key must be present.
     */
    footerOptions?: FooterOptions;
    showFooterOnMobile?: boolean;
    showFooterOnDesktop?: boolean;
}

export function ResponsiveDialog({
                                     children,
                                     isOpen,
                                     setIsOpen,
                                     title,
                                     description = '',
                                     desktopDialogClassContent,
                                     footerOptions,
                                     showFooterOnMobile = true,
                                     showFooterOnDesktop = true,
                                 }: ResponsiveDialogProps) {
    const isMobile = useIsMobile();

    /**
     * Renders the footer based on the provided footerOptions.
     * It chooses the appropriate components for mobile vs. desktop.
     */
    const renderDefaultFooter = (isMobileDevice: boolean) => {
        if (!footerOptions) return null;

        const {
            closeButton,
            actionButton,
            closeButtonLabel = 'Close',
            actionButtonLabel,
            onActionButtonClick,
            message,
        } = footerOptions;

        // Choose the appropriate wrappers for mobile vs. desktop.
        const FooterWrapper = isMobileDevice ? DrawerFooter : DialogFooter;
        const CloseWrapper = isMobileDevice ? DrawerClose : DialogClose;

        // Render the close button:
        // If a custom closeButton is provided, use it;
        // otherwise, render a default close button.
        const renderedCloseButton = closeButton ? (
            closeButton
        ) : (
            <CloseWrapper asChild>
                <Button variant="outline">{closeButtonLabel}</Button>
            </CloseWrapper>
        );

        // Render the action button:
        // If a custom actionButton is provided, use it;
        // otherwise, if both an actionButtonLabel and onActionButtonClick exist, render a default action button.
        const renderedActionButton =
            actionButton ||
            (actionButtonLabel && onActionButtonClick ? (
                <Button variant="outline" onClick={onActionButtonClick}>
                    {actionButtonLabel}
                </Button>
            ) : null);

        const renderFinalButtons = () => {
            return isMobileDevice ? <React.Fragment>{renderedActionButton}{renderedCloseButton}</React.Fragment> : <React.Fragment>{renderedCloseButton}{renderedActionButton}</React.Fragment>
        }

        return (
            <FooterWrapper className="p-0 mt-2">
                {message && (<div className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:items-center w-full">
                    <div className="flex-1">{message}</div>
                    <div className="flex gap-2">
                        {renderFinalButtons()}
                    </div>
                </div>)}
                {renderFinalButtons()}
            </FooterWrapper>
        );
    };

    if (!isMobile) {
        return (
            <Dialog open={isOpen} onOpenChange={(state: boolean) => setIsOpen(state)} modal={!isOpen}>
                <DialogContent
                    className={cn('sm:max-w-xl max-h-[90%] overflow-y-auto', desktopDialogClassContent)}
                    showCustomOverlay={true}
                    onInteractOutside={(e) => e.preventDefault()}
                    onEscapeKeyDown={(e) => e.preventDefault()}
                >
                    {title || description ? <DialogHeader className={title ? '' : 'space-y-0 w-0 absolute'}>
                        <DialogTitle>{title}</DialogTitle>
                        <DialogDescription>{description}</DialogDescription>
                    </DialogHeader> : <VisuallyHidden><DialogHeader className={title ? '' : 'space-y-0 w-0 absolute'}>
                        <DialogTitle>{title}</DialogTitle>
                        <DialogDescription>{description}</DialogDescription>
                    </DialogHeader></VisuallyHidden>}
                    {children}
                    {showFooterOnDesktop && renderDefaultFooter(showFooterOnDesktop)}
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Drawer
            open={isOpen}
            onOpenChange={setIsOpen}
            modal={!isOpen}
            preventScrollRestoration={false}
            disablePreventScroll
            noBodyStyles
        >
            <DrawerContent
                className="p-2 pt-4 md:p-6 md:pb-0 w-full md:w-full h-auto"
                showCustomOverlay={true}
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
                style={{ height: 'auto', maxHeight: '90%' }}
            >
                {title || description ? <DrawerHeader className="text-center">
                    <DrawerTitle>{title}</DrawerTitle>
                    {description && <DrawerDescription>{description}</DrawerDescription>}
                </DrawerHeader> : <VisuallyHidden><DrawerHeader className="text-center">
                    <DrawerTitle>{title}</DrawerTitle>
                    {description && <DrawerDescription>{description}</DrawerDescription>}
                </DrawerHeader></VisuallyHidden>}
                <ScrollArea className="overflow-y-auto">
                    {children}
                    {showFooterOnMobile && renderDefaultFooter(showFooterOnMobile)}
                </ScrollArea>
            </DrawerContent>
        </Drawer>
    );
}
