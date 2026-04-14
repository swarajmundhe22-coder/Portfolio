import { memo, useState } from 'react';
import type { ImgHTMLAttributes, SyntheticEvent } from 'react';

interface CinematicImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  loadedClassName?: string;
  loadingClassName?: string;
}

const CinematicImage = ({
  className,
  loadedClassName = 'is-loaded',
  loadingClassName = 'is-loading',
  onLoad,
  ...imageProps
}: CinematicImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);

  const onImageLoad = (event: SyntheticEvent<HTMLImageElement>): void => {
    setIsLoaded(true);
    onLoad?.(event);
  };

  return (
    <img
      {...imageProps}
      data-progressive-media="true"
      data-progressive-state={isLoaded ? 'loaded' : 'loading'}
      className={`${className ?? ''} ${isLoaded ? loadedClassName : loadingClassName}`.trim()}
      onLoad={onImageLoad}
    />
  );
};

export default memo(CinematicImage);
