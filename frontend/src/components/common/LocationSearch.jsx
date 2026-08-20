import {
    useEffect,
    useState,
  } from "react";
  
  import {
    loadKakaoMapSdk,
  } from "../../api/kakaoMap";
  
  import "./LocationSearch.css";
  
  function LocationSearch({
    value = "",
    onInputChange,
    onSelect,
    placeholder = "예: 수원역",
    inputClassName = "",
  }) {
    const [
      keyword,
      setKeyword,
    ] = useState(value);
  
    const [
      results,
      setResults,
    ] = useState([]);
  
    const [
      isLoading,
      setIsLoading,
    ] = useState(false);
  
    const [
      error,
      setError,
    ] = useState("");
  
    const [
      selectedPlace,
      setSelectedPlace,
    ] = useState(null);
  
    useEffect(() => {
      setKeyword(value);
    }, [value]);
  
    /* ==========================================
       INPUT
    ========================================== */
  
    const handleInputChange = (
      event
    ) => {
      const nextValue =
        event.target.value;
  
      setKeyword(nextValue);
  
      setResults([]);
  
      setError("");
  
      /*
        검색 결과를 선택한 후
        사용자가 다시 글자를 수정했다면
        기존 선택은 무효로 본다.
      */
      setSelectedPlace(null);
  
      onInputChange?.(nextValue);
    };
  
    /* ==========================================
       KAKAO PLACE SEARCH
    ========================================== */
  
    const searchPlaces = async () => {
      const query =
        keyword.trim();
  
      if (!query) {
        setError(
          "출발지를 입력해주세요."
        );
  
        return;
      }
  
      setIsLoading(true);
      setError("");
      setResults([]);
  
      try {
        const kakao =
          await loadKakaoMapSdk();
  
        const placesService =
          new kakao.maps.services.Places();
  
        placesService.keywordSearch(
          query,
  
          (data, status) => {
            setIsLoading(false);
  
            if (
              status ===
              kakao.maps.services.Status.OK
            ) {
              const nextResults =
                data
                  .slice(0, 5)
                  .map(
                    (place) => ({
                      id: place.id,
  
                      placeName:
                        place.place_name,
  
                      address:
                        place.road_address_name ||
                        place.address_name,
  
                      category:
                        place.category_name,
  
                      /*
                        Kakao Place 결과
                        x = 경도
                        y = 위도
                      */
                      lat: Number(
                        place.y
                      ),
  
                      lng: Number(
                        place.x
                      ),
                    })
                  );
  
              setResults(
                nextResults
              );
  
              return;
            }
  
            if (
              status ===
              kakao.maps.services.Status
                .ZERO_RESULT
            ) {
              setError(
                "검색 결과가 없습니다. 다른 장소명을 입력해주세요."
              );
  
              return;
            }
  
            setError(
              "장소 검색에 실패했습니다. 잠시 후 다시 시도해주세요."
            );
          }
        );
      } catch (searchError) {
        console.error(
          "카카오 장소 검색 오류:",
          searchError
        );
  
        setIsLoading(false);
  
        setError(
          searchError.message ||
            "카카오 장소 검색을 사용할 수 없습니다."
        );
      }
    };
  
    /* ==========================================
       SEARCH SUBMIT
    ========================================== */
  
    const handleSubmit = (
      event
    ) => {
      event.preventDefault();
  
      searchPlaces();
    };
  
    /* ==========================================
       PLACE SELECT
    ========================================== */
  
    const handleSelect = (
      place
    ) => {
      setKeyword(
        place.placeName
      );
  
      setSelectedPlace(
        place
      );
  
      setResults([]);
  
      setError("");
  
      onInputChange?.(
        place.placeName
      );
  
      onSelect?.(place);
    };
  
    return (
      <div className="location-search">
        <form
          className="location-search__form"
          onSubmit={handleSubmit}
        >
          <input
            type="text"
            className={`location-search__input ${inputClassName}`}
            value={keyword}
            onChange={
              handleInputChange
            }
            placeholder={placeholder}
            autoComplete="off"
          />
  
          <button
            type="submit"
            className="location-search__button"
            disabled={isLoading}
          >
            {isLoading
              ? "검색 중"
              : "검색"}
          </button>
        </form>
  
        {error && (
          <p className="location-search__error">
            {error}
          </p>
        )}
  
        {results.length > 0 && (
          <div className="location-search__results">
            {results.map(
              (place) => (
                <button
                  key={place.id}
                  type="button"
                  className="location-search__result"
                  onClick={() =>
                    handleSelect(
                      place
                    )
                  }
                >
                  <strong>
                    {
                      place.placeName
                    }
                  </strong>
  
                  <span>
                    {place.address ||
                      "주소 정보 없음"}
                  </span>
  
                  {place.category && (
                    <small>
                      {
                        place.category
                      }
                    </small>
                  )}
                </button>
              )
            )}
          </div>
        )}
  
        {selectedPlace && (
          <div className="location-search__selected">
            <span>
              ✓
            </span>
  
            <div>
              <strong>
                {
                  selectedPlace.placeName
                }
              </strong>
  
              <p>
                출발지가 선택됐어요
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }
  
  export default LocationSearch;