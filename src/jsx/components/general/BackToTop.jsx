import './BackToTop.css';

const BackToTop = ({ selector }) => {
  const onClick = selector => {
    window.appRef.current.querySelector(selector)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  };

  return (
    <div className="container_back_to_top">
      <button aria-label="Back to top" type="button" onClick={() => onClick(selector)}>
        Back to top
      </button>
    </div>
  );
};

export default BackToTop;
